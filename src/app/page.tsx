import Image from "next/image";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/shared/ThemeToggle";

export default function Home() {
  return (
    <div className="p-5">
      <div className="w-full flex justify-end">
        <ThemeToggle/>
      </div>
      <h1 className="font-barlow text-blue-500">Get started!</h1>
      <Button variant='destructive' size='sm'>Test ui</Button>
    </div>
  );
}
