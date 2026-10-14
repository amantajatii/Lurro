// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Unaudited, non-upgradeable implementation of Lurro P0 policy v1.2.
contract ProjectVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public constant ARC_USDC = 0x3600000000000000000000000000000000000000;
    bytes32 public constant TERMS_SCHEMA = keccak256("LURRO_PROJECT_TERMS_V1_2");

    struct MilestoneTerms {
        address submitter;
        uint64 submissionDeadline;
        uint64 finalEvidenceDeadline;
        bytes32 scopeHash;
        uint256[] recipientAmounts;
    }

    struct ProjectTerms {
        bytes32 projectSalt;
        bytes32 signedDocumentHash;
        address funder;
        address usdcToken;
        address verifier;
        address primaryArbiter;
        address backupArbiter;
        address[] recipients;
        MilestoneTerms[] milestones;
        uint32 reviewPeriodSeconds;
        uint32 approvalChallengeSeconds;
        uint32 rejectionChallengeSeconds;
        uint32 backupDelaySeconds;
        uint32 arbitrationPeriodSeconds;
        uint32 cancellationProposalSeconds;
        uint8 maxEvidenceRevisions;
        uint8 fallbackPolicy; // 0: approved snapshot pays; unapproved snapshot refunds.
        uint8 cancellationPolicy; // 0: unanimous project-wide cancellation of unsubmitted scope.
        uint8 recoveryPolicy; // 0: immutable addresses.
    }

    enum Status {
        Planned,
        Reserved,
        Submitted,
        Rejected,
        Approved,
        Disputed,
        Claimable,
        Paid,
        Cancelled
    }

    struct MilestoneState {
        Status status;
        uint32 revision;
        bytes32 evidenceHash;
        bytes32 reasonHash;
        uint64 submittedAt;
        uint64 approvedAt;
        uint64 rejectedAt;
        uint64 disputeOpenedAt;
        bool hadVerifierApprovalBeforeDispute;
    }

    struct CancellationProposal {
        uint64 stateVersion;
        uint64 expiresAt;
        bool executed;
    }

    ProjectTerms private _terms;
    MilestoneState[] private _milestones;
    uint256[] private _totals;
    mapping(uint256 => mapping(bytes32 => bool)) private _usedEvidence;
    mapping(address => bool) public acceptedAgreement;
    mapping(uint256 => mapping(address => bool)) public cancellationApproved;
    mapping(uint256 => CancellationProposal) public cancellationProposals;
    uint256 public latestProposalId;
    uint256 public acceptanceCount;
    uint256 public immutable deploymentChainId;
    bytes32 public immutable termsHash;
    uint256 public immutable contractValue;
    bool public agreementLocked;
    bool public projectCancelled;
    uint64 public stateVersion;
    uint256 public deposited;
    uint256 public available;
    uint256 public reserved;
    uint256 public refundOwed;
    uint256 public paid;
    uint256 public refunded;

    error InvalidInput();
    error InvalidState();
    error Unauthorized();
    error UnsupportedChain();
    error InsufficientFunding();
    error UnexpectedTransfer();
    error DeadlinePassed();
    error DeadlineNotReached();
    error StaleProposal();

    event ProjectCreated(bytes32 indexed termsHash, address indexed funder, uint256 contractValue);
    event AgreementAccepted(address indexed actor, bytes32 indexed termsHash);
    event AgreementLocked(bytes32 indexed termsHash);
    event USDCDeposited(address indexed funder, uint256 amount);
    event FundsReserved(uint256 indexed milestoneId, uint256 amount);
    event EvidenceSubmitted(
        uint256 indexed milestoneId, address indexed submitter, uint32 revision, bytes32 evidenceHash
    );
    event EvidenceReviewed(
        uint256 indexed milestoneId,
        address indexed verifier,
        uint32 revision,
        bytes32 evidenceHash,
        bool approved,
        bytes32 reasonHash
    );
    event DisputeOpened(
        uint256 indexed milestoneId,
        address indexed actor,
        uint32 revision,
        bytes32 evidenceHash,
        bool approvedSnapshot,
        uint64 arbitrationDeadline
    );
    event DisputeResolved(uint256 indexed milestoneId, address indexed actor, bool payout, bool defaultApplied);
    event MilestoneClaimable(uint256 indexed milestoneId);
    event MilestoneCancelled(uint256 indexed milestoneId);
    event RefundQueued(uint256 amount);
    event PaymentSettled(uint256 indexed milestoneId, address indexed recipient, uint256 amount);
    event RefundSettled(address indexed funder, uint256 amount);
    event CancellationProposed(
        uint256 indexed proposalId, bytes32 indexed termsHash, uint64 stateVersion, uint64 expiresAt
    );
    event CancellationApproval(uint256 indexed proposalId, address indexed actor, bool approved);
    event ProjectCancelled(uint256 indexed proposalId);
    event StateVersionAdvanced(uint64 previousVersion, uint64 nextVersion);

    modifier locked() {
        if (!agreementLocked) revert InvalidState();
        if (block.chainid != deploymentChainId) revert UnsupportedChain();
        _;
    }

    constructor(ProjectTerms memory terms) {
        if (block.chainid != 5042 && block.chainid != 5042002) revert UnsupportedChain();
        if (msg.sender != terms.funder) revert Unauthorized();
        _validateTerms(terms);
        _terms = terms;
        deploymentChainId = block.chainid;
        termsHash = keccak256(abi.encode(TERMS_SCHEMA, block.chainid, address(this), terms));
        uint256 total;
        for (uint256 i; i < terms.milestones.length; ++i) {
            uint256 amount;
            for (uint256 j; j < terms.recipients.length; ++j) {
                amount += terms.milestones[i].recipientAmounts[j];
            }
            _totals.push(amount);
            _milestones.push();
            total += amount;
        }
        contractValue = total;
        emit ProjectCreated(termsHash, terms.funder, total);
    }

    function _validateTerms(ProjectTerms memory t) private view {
        if (
            t.usdcToken != ARC_USDC || IERC20Metadata(t.usdcToken).decimals() != 6 || t.signedDocumentHash == bytes32(0)
                || t.recipients.length < 1 || t.recipients.length > 5 || t.milestones.length == 0
                || t.milestones.length > 3 || t.reviewPeriodSeconds != 72 hours
                || t.approvalChallengeSeconds != 48 hours || t.rejectionChallengeSeconds != 48 hours
                || t.backupDelaySeconds != 72 hours || t.arbitrationPeriodSeconds != 7 days
                || t.cancellationProposalSeconds != 7 days || t.maxEvidenceRevisions != 3 || t.fallbackPolicy != 0
                || t.cancellationPolicy != 0 || t.recoveryPolicy != 0
        ) revert InvalidInput();
        address[4] memory roles = [t.funder, t.verifier, t.primaryArbiter, t.backupArbiter];
        for (uint256 i; i < roles.length; ++i) {
            if (roles[i] == address(0) || roles[i] == address(this) || roles[i] == t.usdcToken) revert InvalidInput();
            for (uint256 j; j < i; ++j) {
                if (roles[i] == roles[j]) revert InvalidInput();
            }
        }
        for (uint256 i; i < t.recipients.length; ++i) {
            address recipient = t.recipients[i];
            if (
                recipient == address(0) || recipient == address(this) || recipient == t.usdcToken
                    || (i > 0 && uint160(recipient) <= uint160(t.recipients[i - 1]))
            ) revert InvalidInput();
            for (uint256 j; j < roles.length; ++j) {
                if (recipient == roles[j]) revert InvalidInput();
            }
            bool entitled;
            for (uint256 j; j < t.milestones.length; ++j) {
                if (t.milestones[j].recipientAmounts.length != t.recipients.length) revert InvalidInput();
                if (t.milestones[j].recipientAmounts[i] > 0) entitled = true;
            }
            if (!entitled) revert InvalidInput();
        }
        for (uint256 i; i < t.milestones.length; ++i) {
            MilestoneTerms memory m = t.milestones[i];
            if (
                m.scopeHash == bytes32(0) || m.submissionDeadline <= block.timestamp
                    || (i > 0 && m.submissionDeadline <= t.milestones[i - 1].submissionDeadline)
                    || uint256(m.finalEvidenceDeadline) != uint256(m.submissionDeadline) + 7 days
            ) revert InvalidInput();
            bool validSubmitter;
            uint256 total;
            for (uint256 j; j < t.recipients.length; ++j) {
                if (m.submitter == t.recipients[j]) validSubmitter = true;
                total += m.recipientAmounts[j];
            }
            if (!validSubmitter || total == 0) revert InvalidInput();
        }
    }

    function getTerms() external view returns (ProjectTerms memory) {
        return _terms;
    }

    function getMilestone(uint256 id) external view returns (MilestoneState memory) {
        return _milestone(id);
    }

    function milestoneTotal(uint256 id) external view returns (uint256) {
        _milestone(id);
        return _totals[id];
    }

    function milestoneCount() external view returns (uint256) {
        return _milestones.length;
    }

    function effectiveStatus(uint256 id) public view returns (Status) {
        MilestoneState storage m = _milestone(id);
        if (m.status == Status.Approved && block.timestamp >= uint256(m.approvedAt) + _terms.approvalChallengeSeconds) {
            return Status.Claimable;
        }
        return m.status;
    }

    function rejectionCloseAt(uint256 id) public view returns (uint256) {
        MilestoneState storage m = _milestone(id);
        uint256 closeAt = uint256(m.rejectedAt) + _terms.rejectionChallengeSeconds;
        if (m.revision < _terms.maxEvidenceRevisions && _terms.milestones[id].finalEvidenceDeadline > closeAt) {
            return _terms.milestones[id].finalEvidenceDeadline;
        }
        return closeAt;
    }

    function isParticipant(address actor) public view returns (bool) {
        if (
            actor == _terms.funder || actor == _terms.verifier || actor == _terms.primaryArbiter
                || actor == _terms.backupArbiter
        ) return true;
        for (uint256 i; i < _terms.recipients.length; ++i) {
            if (actor == _terms.recipients[i]) return true;
        }
        return false;
    }

    function activeUnpaidObligations() public view returns (uint256 total) {
        for (uint256 i; i < _milestones.length; ++i) {
            Status s = _milestones[i].status;
            if (s != Status.Paid && s != Status.Cancelled) total += _totals[i];
        }
    }

    function getProjectAccounting()
        external
        view
        returns (uint256 d, uint256 a, uint256 r, uint256 q, uint256 p, uint256 f)
    {
        return (deposited, available, reserved, refundOwed, paid, refunded);
    }

    function acceptAgreement(bytes32 hash) external {
        if (block.chainid != deploymentChainId) revert UnsupportedChain();
        if (!isParticipant(msg.sender)) revert Unauthorized();
        if (hash != termsHash) revert InvalidInput();
        if (agreementLocked || acceptedAgreement[msg.sender]) revert InvalidState();
        acceptedAgreement[msg.sender] = true;
        ++acceptanceCount;
        emit AgreementAccepted(msg.sender, hash);
    }

    function lockAgreement() external {
        if (block.chainid != deploymentChainId) revert UnsupportedChain();
        if (agreementLocked || acceptanceCount != _terms.recipients.length + 4) revert InvalidState();
        agreementLocked = true;
        stateVersion = 1;
        emit AgreementLocked(termsHash);
    }

    function deposit(uint256 amount) external nonReentrant locked {
        if (msg.sender != _terms.funder) revert Unauthorized();
        if (projectCancelled) revert InvalidState();
        if (amount == 0 || available + reserved + amount > activeUnpaidObligations()) revert InvalidInput();
        IERC20 token = IERC20(ARC_USDC);
        uint256 beforeBalance = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        if (token.balanceOf(address(this)) != beforeBalance + amount) revert UnexpectedTransfer();
        deposited += amount;
        available += amount;
        emit USDCDeposited(msg.sender, amount);
        _advance();
    }

    function reserveMilestone(uint256 id) external nonReentrant locked {
        MilestoneState storage m = _milestone(id);
        if (projectCancelled || m.status != Status.Planned) revert InvalidState();
        if (block.timestamp >= _terms.milestones[id].submissionDeadline) revert DeadlinePassed();
        for (uint256 i; i < id; ++i) {
            if (_milestones[i].status == Status.Planned) revert InvalidState();
        }
        uint256 amount = _totals[id];
        if (available < amount) revert InsufficientFunding();
        available -= amount;
        reserved += amount;
        m.status = Status.Reserved;
        emit FundsReserved(id, amount);
        _advance();
    }

    function submitEvidence(uint256 id, bytes32 hash) external nonReentrant locked {
        MilestoneState storage m = _milestone(id);
        if (msg.sender != _terms.milestones[id].submitter) revert Unauthorized();
        if (projectCancelled || m.status != Status.Reserved) revert InvalidState();
        if (block.timestamp >= _terms.milestones[id].submissionDeadline) revert DeadlinePassed();
        _recordEvidence(id, m, hash);
        _advance();
    }

    function resubmitEvidence(uint256 id, bytes32 hash) external nonReentrant locked {
        MilestoneState storage m = _milestone(id);
        if (msg.sender != _terms.milestones[id].submitter) revert Unauthorized();
        if (m.status != Status.Rejected || m.revision >= _terms.maxEvidenceRevisions) revert InvalidState();
        if (block.timestamp >= _terms.milestones[id].finalEvidenceDeadline) revert DeadlinePassed();
        _recordEvidence(id, m, hash);
        _advance();
    }

    function _recordEvidence(uint256 id, MilestoneState storage m, bytes32 hash) private {
        if (hash == bytes32(0) || _usedEvidence[id][hash]) revert InvalidInput();
        _usedEvidence[id][hash] = true;
        ++m.revision;
        m.evidenceHash = hash;
        m.reasonHash = bytes32(0);
        m.submittedAt = uint64(block.timestamp);
        m.status = Status.Submitted;
        emit EvidenceSubmitted(id, msg.sender, m.revision, hash);
    }

    function approveEvidence(uint256 id, uint32 revision, bytes32 hash) external nonReentrant locked {
        MilestoneState storage m = _reviewable(id, revision, hash);
        m.status = Status.Approved;
        m.approvedAt = uint64(block.timestamp);
        emit EvidenceReviewed(id, msg.sender, revision, hash, true, bytes32(0));
        _advance();
    }

    function rejectEvidence(uint256 id, uint32 revision, bytes32 hash, bytes32 reason) external nonReentrant locked {
        MilestoneState storage m = _reviewable(id, revision, hash);
        if (reason == bytes32(0)) revert InvalidInput();
        m.status = Status.Rejected;
        m.reasonHash = reason;
        m.rejectedAt = uint64(block.timestamp);
        emit EvidenceReviewed(id, msg.sender, revision, hash, false, reason);
        _advance();
    }

    function _reviewable(uint256 id, uint32 revision, bytes32 hash) private view returns (MilestoneState storage m) {
        m = _milestone(id);
        if (msg.sender != _terms.verifier) revert Unauthorized();
        if (m.status != Status.Submitted) revert InvalidState();
        if (m.revision != revision || m.evidenceHash != hash) revert InvalidInput();
        if (block.timestamp >= uint256(m.submittedAt) + _terms.reviewPeriodSeconds) revert DeadlinePassed();
    }

    function challengeRejection(uint256 id) external nonReentrant locked {
        MilestoneState storage m = _milestone(id);
        if (msg.sender != _terms.milestones[id].submitter) revert Unauthorized();
        if (m.status != Status.Rejected) revert InvalidState();
        if (block.timestamp >= rejectionCloseAt(id)) revert DeadlinePassed();
        _openDispute(id, m);
        _advance();
    }

    function challengeApproval(uint256 id) external nonReentrant locked {
        MilestoneState storage m = _milestone(id);
        bool allowed = msg.sender == _terms.funder;
        for (uint256 i; i < _terms.recipients.length; ++i) {
            if (msg.sender == _terms.recipients[i] && _terms.milestones[id].recipientAmounts[i] > 0) allowed = true;
        }
        if (!allowed) revert Unauthorized();
        if (m.status != Status.Approved) revert InvalidState();
        if (block.timestamp >= uint256(m.approvedAt) + _terms.approvalChallengeSeconds) revert DeadlinePassed();
        _openDispute(id, m);
        _advance();
    }

    function escalateReviewTimeout(uint256 id) external nonReentrant locked {
        MilestoneState storage m = _milestone(id);
        if (!isParticipant(msg.sender)) revert Unauthorized();
        if (m.status != Status.Submitted) revert InvalidState();
        if (block.timestamp < uint256(m.submittedAt) + _terms.reviewPeriodSeconds) revert DeadlineNotReached();
        _openDispute(id, m);
        _advance();
    }

    function _openDispute(uint256 id, MilestoneState storage m) private {
        if (m.status == Status.Approved) {
            if (block.timestamp >= uint256(m.approvedAt) + _terms.approvalChallengeSeconds) revert DeadlinePassed();
        } else if (m.status != Status.Submitted && m.status != Status.Rejected) {
            revert InvalidState();
        }
        m.hadVerifierApprovalBeforeDispute = m.status == Status.Approved;
        m.disputeOpenedAt = uint64(block.timestamp);
        m.status = Status.Disputed;
        emit DisputeOpened(
            id,
            msg.sender,
            m.revision,
            m.evidenceHash,
            m.hadVerifierApprovalBeforeDispute,
            uint64(block.timestamp + _terms.arbitrationPeriodSeconds)
        );
    }

    function resolveDispute(uint256 id, bool payout) external nonReentrant locked {
        MilestoneState storage m = _milestone(id);
        if (msg.sender != _terms.primaryArbiter && msg.sender != _terms.backupArbiter) revert Unauthorized();
        if (m.status != Status.Disputed) revert InvalidState();
        if (block.timestamp >= uint256(m.disputeOpenedAt) + _terms.arbitrationPeriodSeconds) revert DeadlinePassed();
        if (
            msg.sender == _terms.backupArbiter
                && block.timestamp < uint256(m.disputeOpenedAt) + _terms.backupDelaySeconds
        ) revert DeadlineNotReached();
        _resolve(id, m, payout, false);
        _advance();
    }

    function finalizeDefault(uint256 id) external nonReentrant locked {
        MilestoneState storage m = _milestone(id);
        if (m.status != Status.Disputed) revert InvalidState();
        if (block.timestamp < uint256(m.disputeOpenedAt) + _terms.arbitrationPeriodSeconds) {
            revert DeadlineNotReached();
        }
        _resolve(id, m, m.hadVerifierApprovalBeforeDispute, true);
        _advance();
    }

    function _resolve(uint256 id, MilestoneState storage m, bool payout, bool defaultApplied) private {
        if (payout) {
            m.status = Status.Claimable;
            emit MilestoneClaimable(id);
        } else {
            _cancelMilestone(id, m);
        }
        emit DisputeResolved(id, msg.sender, payout, defaultApplied);
    }

    function finalizeApproval(uint256 id) external nonReentrant locked {
        MilestoneState storage m = _milestone(id);
        if (m.status != Status.Approved) revert InvalidState();
        if (effectiveStatus(id) != Status.Claimable) revert DeadlineNotReached();
        m.status = Status.Claimable;
        emit MilestoneClaimable(id);
        _advance();
    }

    function finalizeRejection(uint256 id) external nonReentrant locked {
        MilestoneState storage m = _milestone(id);
        if (m.status != Status.Rejected) revert InvalidState();
        if (block.timestamp < rejectionCloseAt(id)) revert DeadlineNotReached();
        _cancelMilestone(id, m);
        _advance();
    }

    function expireUnsubmitted(uint256 id) external nonReentrant locked {
        MilestoneState storage m = _milestone(id);
        if (m.status != Status.Planned && m.status != Status.Reserved) revert InvalidState();
        if (block.timestamp < _terms.milestones[id].submissionDeadline) revert DeadlineNotReached();
        _cancelMilestone(id, m);
        _advance();
    }

    function _cancelMilestone(uint256 id, MilestoneState storage m) private {
        if (m.status != Status.Planned) {
            reserved -= _totals[id];
            _queueRefund(_totals[id]);
        }
        m.status = Status.Cancelled;
        emit MilestoneCancelled(id);
        _refundSurplus();
    }

    function _refundSurplus() private {
        uint256 needed = activeUnpaidObligations() - reserved;
        if (available > needed) {
            uint256 excess = available - needed;
            available -= excess;
            _queueRefund(excess);
        }
    }

    function _queueRefund(uint256 amount) private {
        if (amount == 0) return;
        refundOwed += amount;
        emit RefundQueued(amount);
    }

    function executePayout(uint256 id) external nonReentrant locked {
        MilestoneState storage m = _milestone(id);
        if (effectiveStatus(id) != Status.Claimable) revert InvalidState();
        m.status = Status.Paid;
        reserved -= _totals[id];
        paid += _totals[id];
        for (uint256 i; i < _terms.recipients.length; ++i) {
            uint256 amount = _terms.milestones[id].recipientAmounts[i];
            if (amount == 0) continue;
            _transferExact(_terms.recipients[i], amount);
            emit PaymentSettled(id, _terms.recipients[i], amount);
        }
        _refundSurplus();
        _advance();
    }

    function claimRefund() external nonReentrant locked {
        uint256 amount = refundOwed;
        if (amount == 0) revert InvalidState();
        refundOwed = 0;
        refunded += amount;
        _transferExact(_terms.funder, amount);
        emit RefundSettled(_terms.funder, amount);
        _advance();
    }

    function _transferExact(address to, uint256 amount) private {
        IERC20 token = IERC20(ARC_USDC);
        uint256 beforeVault = token.balanceOf(address(this));
        uint256 beforeRecipient = token.balanceOf(to);
        token.safeTransfer(to, amount);
        if (token.balanceOf(address(this)) + amount != beforeVault || token.balanceOf(to) != beforeRecipient + amount) {
            revert UnexpectedTransfer();
        }
    }

    function createCancellationProposal() external locked returns (uint256 id) {
        if (msg.sender != _terms.funder) revert Unauthorized();
        if (projectCancelled || activeUnpaidObligations() == 0) revert InvalidState();
        id = ++latestProposalId;
        uint64 expires = uint64(block.timestamp + _terms.cancellationProposalSeconds);
        cancellationProposals[id] = CancellationProposal(stateVersion, expires, false);
        cancellationApproved[id][msg.sender] = true;
        emit CancellationProposed(id, termsHash, stateVersion, expires);
        emit CancellationApproval(id, msg.sender, true);
    }

    function approveCancellationProposal(uint256 id) external locked {
        _checkCancellationSigner();
        _proposal(id);
        if (cancellationApproved[id][msg.sender]) revert InvalidState();
        cancellationApproved[id][msg.sender] = true;
        emit CancellationApproval(id, msg.sender, true);
    }

    function revokeCancellationApproval(uint256 id) external locked {
        _checkCancellationSigner();
        _proposal(id);
        if (!cancellationApproved[id][msg.sender]) revert InvalidState();
        cancellationApproved[id][msg.sender] = false;
        emit CancellationApproval(id, msg.sender, false);
    }

    function _checkCancellationSigner() private view {
        if (msg.sender == _terms.funder) return;
        for (uint256 i; i < _terms.recipients.length; ++i) {
            if (msg.sender == _terms.recipients[i]) return;
        }
        revert Unauthorized();
    }

    function _proposal(uint256 id) private view returns (CancellationProposal storage p) {
        p = cancellationProposals[id];
        if (id == 0 || id != latestProposalId || p.executed || projectCancelled) revert InvalidState();
        if (block.timestamp >= p.expiresAt) revert DeadlinePassed();
        if (p.stateVersion != stateVersion) revert StaleProposal();
    }

    function executeEarlyCancellation(uint256 id) external nonReentrant locked {
        CancellationProposal storage p = _proposal(id);
        if (!cancellationApproved[id][_terms.funder]) revert InvalidState();
        for (uint256 i; i < _terms.recipients.length; ++i) {
            if (!cancellationApproved[id][_terms.recipients[i]]) revert InvalidState();
        }
        p.executed = true;
        projectCancelled = true;
        for (uint256 i; i < _milestones.length; ++i) {
            MilestoneState storage m = _milestones[i];
            if (m.status == Status.Planned || m.status == Status.Reserved) _cancelMilestone(i, m);
        }
        uint256 amount = available;
        available = 0;
        _queueRefund(amount);
        emit ProjectCancelled(id);
        _advance();
    }

    function _milestone(uint256 id) private view returns (MilestoneState storage m) {
        if (id >= _milestones.length) revert InvalidInput();
        return _milestones[id];
    }

    function _advance() private {
        uint64 previous = stateVersion;
        stateVersion = previous + 1;
        emit StateVersionAdvanced(previous, stateVersion);
    }
}
