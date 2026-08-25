import Navbar from "@/components/layout/Navbar";
import BatchProcessor from "@/components/features/BatchProcessor";

export default function Batch() {
  return (
    <div className="min-h-screen bg-[#050d1a] text-white">
      <Navbar />
      <div className="pt-16">
        <BatchProcessor />
      </div>
    </div>
  );
}
