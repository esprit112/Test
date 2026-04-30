
/**
 * Icons for navigation
 */
const icons = {
    arrowLeft: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`,
    arrowRight: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
    home: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`,
    external: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`
};

/**
 * Generates the Gallery/Index Page
 */
export const generateReportIndexHtml = (project, images, logoDataUri) => {
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const logoHtml = logoDataUri 
        ? `<div class="w-16 h-16 bg-black border border-neon-cyan flex items-center justify-center rounded-lg shadow-[0_0_15px_rgba(15,240,252,0.3)] overflow-hidden p-1"><img src="${logoDataUri}" class="w-full h-full object-contain" alt="Lumina Restore"></div>`
        : `<div class="w-12 h-12 bg-black border border-neon-cyan flex items-center justify-center rounded-lg shadow-[0_0_15px_rgba(15,240,252,0.3)]"><span class="text-neon-cyan font-display font-bold text-2xl">L</span></div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gallery: ${project.title}</title>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            fontFamily: { mono: ['JetBrains Mono', 'monospace'], display: ['Space Grotesk', 'sans-serif'] },
            colors: {
              gray: { 900: '#0f172a', 950: '#020617' },
              neon: { cyan: '#0ff0fc', pink: '#ff2a6d', purple: '#7b2cff' }
            }
          }
        }
      }
    </script>
    <style>
      body { background-color: #020617; color: #e2e8f0; }
      .glass { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
      .custom-scrollbar::-webkit-scrollbar { width: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: #020617; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
    </style>
</head>
<body class="p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
    <header class="flex justify-between items-end border-b border-gray-800 pb-8 mb-12">
        <div>
            <div class="flex items-center gap-4 mb-2">
                ${logoHtml}
                <div>
                    <h1 class="text-3xl font-display font-bold text-white tracking-tight">Lumina <span class="text-neon-cyan">Restore</span></h1>
                    <p class="text-xs font-mono text-gray-500 uppercase tracking-widest">Restoration Gallery</p>
                </div>
            </div>
        </div>
        <div class="text-right">
            <div class="text-xl font-display font-bold text-white mb-1">${project.title}</div>
            <div class="text-sm font-mono text-gray-400">Client: ${project.clientName}</div>
            <div class="text-xs font-mono text-gray-600 mt-2">${dateStr}</div>
        </div>
    </header>

    <main class="flex-1">
       <div class="flex items-center justify-between mb-8">
           <h2 class="text-sm font-mono text-neon-cyan uppercase tracking-widest flex items-center gap-2">
                <span class="w-2 h-2 bg-neon-cyan rounded-full"></span> Project Assets
           </h2>
           <span class="text-xs font-mono text-gray-500 border border-gray-800 px-2 py-1 rounded">${images.length} Reports Generated</span>
       </div>

       <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          ${images.map(img => `
             <a href="${img.reportFilename}" class="group block bg-gray-900 border border-gray-800 hover:border-neon-cyan/50 rounded-xl overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(15,240,252,0.1)] hover:-translate-y-1">
                <div class="aspect-[4/3] relative overflow-hidden bg-black border-b border-gray-800">
                   <img src="${img.thumbnailPath}" loading="lazy" class="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" alt="${img.displayFilename}">
                   <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
                </div>
                <div class="p-4">
                   <div class="text-white font-bold text-sm truncate mb-1 group-hover:text-neon-cyan transition-colors" title="${img.displayFilename}">${img.displayFilename}</div>
                   <div class="flex items-center justify-between mt-3">
                       <span class="text-[10px] text-gray-500 font-mono uppercase bg-gray-950 px-2 py-1 rounded border border-gray-800">Report Ready</span>
                       <div class="p-1.5 rounded-full bg-gray-800 text-gray-400 group-hover:bg-neon-cyan group-hover:text-black transition-colors">
                            ${icons.external}
                       </div>
                   </div>
                </div>
             </a>
          `).join('')}
       </div>
    </main>
    
    <footer class="mt-20 pt-8 border-t border-gray-800 text-center">
        <p class="text-xs font-mono text-gray-600">Generated by Lumina Restore • Forensic Restoration Platform</p>
    </footer>
</body>
</html>`;
};

/**
 * Generates a stunning, ultra-modern forensic restoration report.
 */
export const generateImageReportHtml = (project, image, logoDataUri, nav) => {
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const analysis = image.analysis || {};
    
    // Safety checks for arrays
    const subjects = analysis.subjects || [];
    const objects = analysis.detectedObjects || [];
    const defects = analysis.defects || [];
    const steps = analysis.restorationPlan || [];
    const groundingLinks = analysis.groundingLinks || [];
    
    const mapLink = groundingLinks.find(l => l.uri.includes('maps') || l.uri.includes('google'));

    // Logo Logic
    const logoHtml = logoDataUri 
        ? `<div class="w-16 h-16 bg-black border border-neon-cyan flex items-center justify-center rounded-lg shadow-[0_0_15px_rgba(15,240,252,0.3)] overflow-hidden p-1">
             <img src="${logoDataUri}" class="w-full h-full object-contain" alt="Lumina Restore">
           </div>`
        : `<div class="w-12 h-12 bg-black border border-neon-cyan flex items-center justify-center rounded-lg shadow-[0_0_15px_rgba(15,240,252,0.3)]">
             <span class="text-neon-cyan font-display font-bold text-2xl">L</span>
           </div>`;
           
    // Navigation HTML
    const navHtml = nav ? `
    <div class="fixed top-6 right-6 z-50 flex items-center gap-1 bg-gray-950/80 backdrop-blur-xl border border-gray-800 p-1 rounded-lg shadow-2xl print:hidden">
        ${nav.prev ? `<a href="${nav.prev}" class="p-2 hover:bg-gray-800 rounded-md text-gray-400 hover:text-white transition-colors" title="Previous Image">${icons.arrowLeft}</a>` : `<span class="p-2 text-gray-800 cursor-not-allowed opacity-30">${icons.arrowLeft}</span>`}
        <a href="${nav.home}" class="p-2 hover:bg-neon-cyan/10 rounded-md text-neon-cyan transition-colors mx-1 border-x border-gray-800" title="Back to Gallery">${icons.home}</a>
        ${nav.next ? `<a href="${nav.next}" class="p-2 hover:bg-gray-800 rounded-md text-gray-400 hover:text-white transition-colors" title="Next Image">${icons.arrowRight}</a>` : `<span class="p-2 text-gray-800 cursor-not-allowed opacity-30">${icons.arrowRight}</span>`}
    </div>` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lumina Restore Report: ${image.displayFilename}</title>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            fontFamily: { mono: ['JetBrains Mono', 'monospace'], display: ['Space Grotesk', 'sans-serif'] },
            colors: {
              gray: { 900: '#0f172a', 950: '#020617' },
              neon: { cyan: '#0ff0fc', pink: '#ff2a6d', purple: '#7b2cff' }
            }
          }
        }
      }
    </script>
    <style>
      body { background-color: #020617; color: #e2e8f0; }
      .glass { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
      .neon-text { text-shadow: 0 0 10px rgba(15, 240, 252, 0.5); }
      @page { size: A4; margin: 0; }
      @media print { body { -webkit-print-color-adjust: exact; } .print\\:hidden { display: none; } }
    </style>
</head>
<body class="p-8 max-w-5xl mx-auto relative">
    
    ${navHtml}

    <!-- HEADER -->
    <header class="flex justify-between items-end border-b border-gray-800 pb-8 mb-12">
        <div>
            <div class="flex items-center gap-4 mb-2">
                ${logoHtml}
                <div>
                    <h1 class="text-3xl font-display font-bold text-white tracking-tight">Lumina <span class="text-neon-cyan">Restore</span></h1>
                    <p class="text-xs font-mono text-gray-500 uppercase tracking-widest">Forensic Restoration Report</p>
                </div>
            </div>
        </div>
        <div class="text-right">
            <div class="text-xl font-display font-bold text-white mb-1">${project.title}</div>
            <div class="text-sm font-mono text-gray-400">Client: ${project.clientName}</div>
            <div class="text-xs font-mono text-gray-600 mt-2">${dateStr}</div>
        </div>
    </header>

    <!-- VISUAL EVIDENCE -->
    <section class="mb-16">
        <h2 class="text-sm font-mono text-neon-pink uppercase tracking-widest mb-6 flex items-center gap-2">
            <span class="w-2 h-2 bg-neon-pink rounded-full"></span> Visual Evidence
        </h2>
        <div class="grid grid-cols-2 gap-8">
            <div class="space-y-3">
                <div class="relative aspect-[4/3] bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
                    <img src="${image.originalPath}" class="absolute inset-0 w-full h-full object-contain" alt="Original">
                </div>
                <div class="text-center font-mono text-xs text-gray-500 uppercase">Original Condition</div>
            </div>
            <div class="space-y-3">
                <div class="relative aspect-[4/3] bg-gray-900 rounded-2xl overflow-hidden border border-neon-cyan shadow-[0_0_20px_rgba(15,240,252,0.1)]">
                    <img src="${image.restoredPath || image.originalPath}" class="absolute inset-0 w-full h-full object-contain" alt="Restored">
                </div>
                <div class="text-center font-mono text-xs text-neon-cyan uppercase font-bold">${image.restoredPath ? 'Restored Result' : 'Analysis Preview'}</div>
            </div>
        </div>
    </section>

    <!-- MATERIAL ARCHAEOLOGY & LOCATION -->
    <section class="mb-16">
        <div class="grid grid-cols-3 gap-6">
            <!-- Diagnosis -->
            <div class="col-span-2 glass rounded-2xl p-6">
                <h3 class="text-xs font-mono text-gray-400 uppercase mb-4">Material Archaeology</h3>
                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <div class="text-[10px] uppercase text-gray-600 mb-1">Substrate</div>
                        <div class="text-lg font-display text-white">${analysis.materialSubstrate || 'N/A'}</div>
                    </div>
                    <div>
                        <div class="text-[10px] uppercase text-gray-600 mb-1">Historical Era</div>
                        <div class="text-lg font-display text-white">${analysis.historicalEra || 'N/A'}</div>
                    </div>
                    <div class="col-span-2">
                        <div class="text-[10px] uppercase text-gray-600 mb-2">Condition Rating</div>
                        <div class="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                            <div class="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" style="width: ${analysis.conditionRating * 10}%"></div>
                        </div>
                        <div class="flex justify-between text-xs font-mono">
                            <span>Critical</span>
                            <span class="text-white font-bold">${analysis.conditionRating}/10</span>
                            <span>Mint</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Location -->
            <div class="glass rounded-2xl p-6 flex flex-col justify-between">
                <div>
                    <h3 class="text-xs font-mono text-gray-400 uppercase mb-4">Geolocation</h3>
                    <p class="text-sm text-white leading-relaxed mb-4">${analysis.geolocation || 'No location data derived from image features.'}</p>
                </div>
                ${mapLink ? `
                <div class="space-y-2">
                    <a href="${mapLink.uri}" target="_blank" class="block w-full py-3 bg-gray-800 hover:bg-gray-700 text-center rounded-lg text-xs font-mono uppercase text-neon-cyan border border-gray-700 transition-colors">
                        View on Google Maps
                    </a>
                </div>
                ` : ''}
            </div>
        </div>
    </section>

    <!-- DETECTED ENTITIES -->
    <section class="mb-16">
        <h2 class="text-sm font-mono text-neon-purple uppercase tracking-widest mb-6 flex items-center gap-2">
            <span class="w-2 h-2 bg-neon-purple rounded-full"></span> Semantic Analysis
        </h2>
        <div class="grid grid-cols-2 gap-6">
            <!-- Subjects -->
            <div class="glass rounded-2xl p-6">
                <h3 class="text-xs font-bold text-white uppercase mb-4 border-b border-gray-700 pb-2">Identified Subjects</h3>
                ${subjects.length > 0 ? `
                <table class="w-full text-left text-sm">
                    <thead>
                        <tr class="text-gray-500 text-[10px] uppercase">
                            <th class="pb-2">Age Group</th>
                            <th class="pb-2">Gender</th>
                            <th class="pb-2 text-right">Count</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-800 font-mono text-xs">
                        ${subjects.map(s => `
                        <tr>
                            <td class="py-2 text-gray-300">${s.ageGroup}</td>
                            <td class="py-2 text-gray-400">${s.gender}</td>
                            <td class="py-2 text-right text-white">${s.count}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
                ` : '<p class="text-xs text-gray-500 italic">No human subjects detected.</p>'}
            </div>

            <!-- Objects -->
            <div class="glass rounded-2xl p-6">
                <h3 class="text-xs font-bold text-white uppercase mb-4 border-b border-gray-700 pb-2">Detected Objects</h3>
                ${objects.length > 0 ? `
                <div class="flex flex-wrap gap-2">
                    ${objects.map(o => `
                    <div class="bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-700 flex flex-col">
                        <span class="text-xs text-white font-medium">${o.object}</span>
                        <span class="text-[10px] text-gray-500 uppercase">${o.category}</span>
                    </div>
                    `).join('')}
                </div>
                ` : '<p class="text-xs text-gray-500 italic">No significant objects detected.</p>'}
            </div>
        </div>
    </section>

    <!-- FULL RESTORATION LOG (Including Refinements) -->
    <section>
        <h2 class="text-sm font-mono text-neon-cyan uppercase tracking-widest mb-6 flex items-center gap-2">
            <span class="w-2 h-2 bg-neon-cyan rounded-full"></span> Comprehensive Restoration Log
        </h2>
        
        <!-- Steps -->
        <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${steps.map((step, i) => {
                    const isRefinement = step.tool?.toLowerCase().includes('refine');
                    return `
                    <div class="p-4 ${isRefinement ? 'bg-purple-900/10 border-purple-900/40' : 'bg-blue-900/10 border-blue-900/30'} border rounded-xl flex flex-col gap-2">
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded ${isRefinement ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}">
                                ${isRefinement ? 'Post-Audit Refinement' : 'Main Restoration Step'}
                            </span>
                            <span class="text-[10px] font-bold text-gray-500 uppercase">#${i + 1}</span>
                        </div>
                        <h4 class="text-sm text-white font-bold leading-snug">${step.description}</h4>
                        <div class="flex justify-between items-end mt-2 pt-2 border-t ${isRefinement ? 'border-purple-900/20' : 'border-blue-900/20'}">
                            <div class="flex flex-col">
                                <span class="text-[9px] text-gray-600 uppercase">Module</span>
                                <span class="text-[10px] text-gray-400 font-mono">${step.tool}</span>
                            </div>
                            <div class="flex flex-col items-end">
                                <span class="text-[9px] text-gray-600 uppercase">Status</span>
                                <span class="text-[10px] ${step.status === 'completed' ? 'text-green-400' : 'text-gray-500'} font-bold uppercase">${step.status}</span>
                            </div>
                        </div>
                    </div>
                    `;
                }).join('')}
                ${steps.length === 0 ? '<p class="text-xs text-gray-500 italic col-span-2">No restoration steps recorded.</p>' : ''}
            </div>
        </div>
    </section>

    <footer class="mt-20 pt-8 border-t border-gray-800 text-center">
        <p class="text-xs font-mono text-gray-600">Generated by Lumina Restore • Forensic AI Pipeline (Gemini 3 Series)</p>
    </footer>

</body>
</html>`;
};
