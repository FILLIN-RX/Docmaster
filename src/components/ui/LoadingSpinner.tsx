import { Loader } from "@mantine/core";

export default function LoadingSpinner({ minHeight = "60vh" }: { minHeight?: string }) {
  return (
    <div className="flex items-center justify-center" style={{ minHeight }}>
      <Loader color="gold" size="lg" />
    </div>
  );
}
