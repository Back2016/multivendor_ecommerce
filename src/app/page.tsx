import ThemeToggle from "@/components/shared/ThemeToggle";
import { UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="p-5">
      <div className="w-full flex gap-x-5 justify-end">
        <UserButton/>
        <ThemeToggle/>
      </div>
      <h1 className="font-barlow text-blue-500">Home Page</h1>
    </div>
  );
}
