import { notFound } from "next/navigation";
import { z } from "zod";
import { getReportSnapshotForCurrentIdentity } from "@/features/reports/queries";
import { ReportViewer } from "@/features/reports/components/ReportViewer";

export const runtime = "nodejs";

type ReportPageProps = {
  params: Promise<{ reportId: string }>;
};

const reportPageParamsSchema = z.object({
  reportId: z.string().uuid(),
});

export default async function ReportPage({ params }: ReportPageProps) {
  const parsedParams = reportPageParamsSchema.safeParse(await params);

  if (!parsedParams.success) {
    notFound();
  }

  const { reportId } = parsedParams.data;
  const report = await getReportSnapshotForCurrentIdentity(reportId);

  if (!report) {
    notFound();
  }

  return <ReportViewer report={report} />;
}
