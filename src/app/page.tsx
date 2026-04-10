import { auth } from "@/lib/auth";
import HomeView from "@/modules/Home/ui/view/home-view";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getJobs } from "@/app/actions/job-actions";

export default async function Home() {
  const session = await auth.api.getSession({
      headers: await headers(),
  })
  if(!session){
    redirect("/sign-in");
  }

  const initialServerJobs = await getJobs();

  return (
     <HomeView initialServerJobs={initialServerJobs} />
  );
}