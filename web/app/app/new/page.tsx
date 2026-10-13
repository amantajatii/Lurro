import type { Metadata } from "next";
import { CreateProject } from "../../../components/project/create-project";
import "./create.css";
export const metadata: Metadata = { title: "Create project — Lurro", robots: { index: false, follow: false } };
export default function NewProjectPage() { return <CreateProject />; }
