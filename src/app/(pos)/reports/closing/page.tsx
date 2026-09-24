import type { Metadata } from "next";
import { ClosingView } from "@/components/closing/closing-view";
import { getClosing, getPeriod, listClosings } from "@/lib/queries/data";
import { isValidDate, shopDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Daily Closing" };
export const dynamic = "force-dynamic";

export default async function ClosingPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date: d } = await searchParams;
  const today = shopDate();
  const date = isValidDate(d) && d <= today ? d : today;
  const [period, closing, history] = await Promise.all([getPeriod({ from: date, to: date }), getClosing(date), listClosings(60)]);
  return <ClosingView date={date} today={today} summary={period.summary} closing={closing} history={history} />;
}
