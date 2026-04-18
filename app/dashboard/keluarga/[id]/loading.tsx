import React from 'react';

export default function LoadingKeluargaDetail() {
  return (
    <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Back button skeleton */}
      <div className="w-48 h-5 bg-gray-200 rounded animate-pulse mb-6"></div>

      {/* Section 1 Card Skeleton (Profil KK) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-64 h-7 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex items-center gap-3">
             <div className="w-32 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
             <div className="w-32 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={i === 4 ? "md:col-span-2 lg:col-span-2" : ""}>
                 <div className="w-28 h-4 bg-gray-200 rounded animate-pulse mb-3"></div>
                 <div className={`h-6 bg-gray-200 rounded animate-pulse ${i === 4 ? 'w-full max-w-md' : 'w-48'}`}></div>
              </div>
            ))}
        </div>
      </div>

      {/* Section 2 Card Skeleton (Daftar Anggota) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-56 h-7 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-40 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="p-6 overflow-x-auto">
           <div className="space-y-4 min-w-[800px]">
             {/* Table Header skeleton */}
             <div className="w-full h-10 bg-[#166534]/10 rounded animate-pulse mb-6"></div>
             {/* Table Rows skeleton */}
             {[1, 2, 3].map(i => (
               <div key={i} className="flex items-center justify-between gap-4 w-full border-b border-gray-100 pb-4">
                 <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                 <div className="w-48 h-5 bg-gray-200 rounded animate-pulse"></div>
                 <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                 <div className="w-24 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                 <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                 <div className="w-16 h-6 bg-gray-200 rounded-md animate-pulse"></div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </main>
  );
}
