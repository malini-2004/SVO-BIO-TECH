export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mb-4"></div>
        <p className="text-primary-800 font-bold animate-pulse">Loading SVO Biotech...</p>
      </div>
    </div>
  );
}
