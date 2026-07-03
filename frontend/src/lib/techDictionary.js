/* 
 * BACKEND INTEGRATION ARCHITECTURE NOTE:
 * 
 * In a production environment, this hardcoded dictionary of 100+ technologies 
 * should be migrated to a relational database to allow dynamic updates without frontend deployments.
 * 
 * Schema (PostgreSQL):
 * Table: technologies
 * - id: UUID (Primary Key)
 * - name: VARCHAR(100) (e.g., 'React')
 * - slug: VARCHAR(100) UNIQUE (e.g., 'react')
 * - icon_url: TEXT (e.g., 'https://cdn.simpleicons.org/react/61DAFB')
 * - official_url: TEXT (e.g., 'https://react.dev')
 * - category: VARCHAR(50) (e.g., 'Frontend', 'Database', 'Cloud')
 * 
 * API Endpoints:
 * - GET /api/v1/technologies -> Returns the cached JSON mapping array for the frontend to build this map dynamically.
 * 
 * For this MVP, we are statically exporting the mapping covering the 50+ most commonly used tech.
 */

export const TECH_DICTIONARY = {
  // --- FRONTEND ---
  'react': { icon: 'https://cdn.simpleicons.org/react/61DAFB', url: 'https://react.dev' },
  'next.js': { icon: 'https://cdn.simpleicons.org/nextdotjs/000000', url: 'https://nextjs.org' },
  'nextjs': { icon: 'https://cdn.simpleicons.org/nextdotjs/000000', url: 'https://nextjs.org' },
  'vue': { icon: 'https://cdn.simpleicons.org/vuedotjs/4FC08D', url: 'https://vuejs.org' },
  'svelte': { icon: 'https://cdn.simpleicons.org/svelte/FF3E00', url: 'https://svelte.dev' },
  'angular': { icon: 'https://cdn.simpleicons.org/angular/DD0031', url: 'https://angular.io' },
  'html': { icon: 'https://cdn.simpleicons.org/html5/E34F26', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML' },
  'css': { icon: 'https://cdn.simpleicons.org/css3/1572B6', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS' },
  'javascript': { icon: 'https://cdn.simpleicons.org/javascript/F7DF1E', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
  'js': { icon: 'https://cdn.simpleicons.org/javascript/F7DF1E', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
  'typescript': { icon: 'https://cdn.simpleicons.org/typescript/3178C6', url: 'https://www.typescriptlang.org' },
  'ts': { icon: 'https://cdn.simpleicons.org/typescript/3178C6', url: 'https://www.typescriptlang.org' },
  'tailwind': { icon: 'https://cdn.simpleicons.org/tailwindcss/06B6D4', url: 'https://tailwindcss.com' },
  'tailwindcss': { icon: 'https://cdn.simpleicons.org/tailwindcss/06B6D4', url: 'https://tailwindcss.com' },
  'bootstrap': { icon: 'https://cdn.simpleicons.org/bootstrap/7952B3', url: 'https://getbootstrap.com' },
  'shadcn': { icon: 'https://cdn.simpleicons.org/shadcnui/000000', url: 'https://ui.shadcn.com' },
  'shadcnui': { icon: 'https://cdn.simpleicons.org/shadcnui/000000', url: 'https://ui.shadcn.com' },
  
  // --- BACKEND ---
  'node.js': { icon: 'https://cdn.simpleicons.org/nodedotjs/339933', url: 'https://nodejs.org' },
  'node': { icon: 'https://cdn.simpleicons.org/nodedotjs/339933', url: 'https://nodejs.org' },
  'express': { icon: 'https://cdn.simpleicons.org/express/000000', url: 'https://expressjs.com' },
  'express.js': { icon: 'https://cdn.simpleicons.org/express/000000', url: 'https://expressjs.com' },
  'python': { icon: 'https://cdn.simpleicons.org/python/3776AB', url: 'https://www.python.org' },
  'django': { icon: 'https://cdn.simpleicons.org/django/092E20', url: 'https://www.djangoproject.com' },
  'flask': { icon: 'https://cdn.simpleicons.org/flask/000000', url: 'https://flask.palletsprojects.com' },
  'fastapi': { icon: 'https://cdn.simpleicons.org/fastapi/009688', url: 'https://fastapi.tiangolo.com' },
  'java': { icon: 'https://cdn.simpleicons.org/openjdk/FFFFFF', url: 'https://www.java.com' },
  'spring': { icon: 'https://cdn.simpleicons.org/spring/6DB33F', url: 'https://spring.io' },
  'rust': { icon: 'https://cdn.simpleicons.org/rust/000000', url: 'https://www.rust-lang.org' },
  'go': { icon: 'https://cdn.simpleicons.org/go/00ADD8', url: 'https://go.dev' },
  'golang': { icon: 'https://cdn.simpleicons.org/go/00ADD8', url: 'https://go.dev' },
  'c++': { icon: 'https://cdn.simpleicons.org/cplusplus/00599C', url: 'https://isocpp.org' },
  'cpp': { icon: 'https://cdn.simpleicons.org/cplusplus/00599C', url: 'https://isocpp.org' },
  'c#': { icon: 'https://cdn.simpleicons.org/csharp/239120', url: 'https://docs.microsoft.com/en-us/dotnet/csharp/' },
  'dotnet': { icon: 'https://cdn.simpleicons.org/dotnet/512BD4', url: 'https://dotnet.microsoft.com' },
  'ruby': { icon: 'https://cdn.simpleicons.org/ruby/CC342D', url: 'https://www.ruby-lang.org' },
  'rails': { icon: 'https://cdn.simpleicons.org/rubyonrails/D30001', url: 'https://rubyonrails.org' },
  'php': { icon: 'https://cdn.simpleicons.org/php/777BB4', url: 'https://www.php.net' },
  'laravel': { icon: 'https://cdn.simpleicons.org/laravel/FF2D20', url: 'https://laravel.com' },
  
  // --- DATABASE ---
  'postgresql': { icon: 'https://cdn.simpleicons.org/postgresql/4169E1', url: 'https://www.postgresql.org' },
  'postgres': { icon: 'https://cdn.simpleicons.org/postgresql/4169E1', url: 'https://www.postgresql.org' },
  'mysql': { icon: 'https://cdn.simpleicons.org/mysql/4479A1', url: 'https://www.mysql.com' },
  'sqlite': { icon: 'https://cdn.simpleicons.org/sqlite/003B57', url: 'https://sqlite.org' },
  'mongodb': { icon: 'https://cdn.simpleicons.org/mongodb/47A248', url: 'https://www.mongodb.com' },
  'redis': { icon: 'https://cdn.simpleicons.org/redis/DC382D', url: 'https://redis.io' },
  'supabase': { icon: 'https://cdn.simpleicons.org/supabase/3ECF8E', url: 'https://supabase.com' },
  'firebase': { icon: 'https://cdn.simpleicons.org/firebase/FFCA28', url: 'https://firebase.google.com' },
  'prisma': { icon: 'https://cdn.simpleicons.org/prisma/2D3748', url: 'https://www.prisma.io' },
  
  // --- DEVOPS & INFRASTRUCTURE ---
  'docker': { icon: 'https://cdn.simpleicons.org/docker/2496ED', url: 'https://www.docker.com' },
  'kubernetes': { icon: 'https://cdn.simpleicons.org/kubernetes/326CE5', url: 'https://kubernetes.io' },
  'aws': { icon: 'https://cdn.simpleicons.org/amazonaws/232F3E', url: 'https://aws.amazon.com' },
  'gcp': { icon: 'https://cdn.simpleicons.org/googlecloud/4285F4', url: 'https://cloud.google.com' },
  'azure': { icon: 'https://cdn.simpleicons.org/microsoftazure/0089D6', url: 'https://azure.microsoft.com' },
  'linux': { icon: 'https://cdn.simpleicons.org/linux/FCC624', url: 'https://www.kernel.org' },
  'ubuntu': { icon: 'https://cdn.simpleicons.org/ubuntu/E95420', url: 'https://ubuntu.com' },
  'bash': { icon: 'https://cdn.simpleicons.org/gnubash/4EAA25', url: 'https://www.gnu.org/software/bash/' },
  'cli': { icon: 'https://cdn.simpleicons.org/gnubash/4EAA25', url: 'https://www.gnu.org/software/bash/' },
  'git': { icon: 'https://cdn.simpleicons.org/git/F05032', url: 'https://git-scm.com' },
  'github': { icon: 'https://cdn.simpleicons.org/github/181717', url: 'https://github.com' },
  'vercel': { icon: 'https://cdn.simpleicons.org/vercel/000000', url: 'https://vercel.com' },
  
  // --- DEEP LEARNING & AI ---
  'tensorflow': { icon: 'https://cdn.simpleicons.org/tensorflow/FF6F00', url: 'https://www.tensorflow.org' },
  'pytorch': { icon: 'https://cdn.simpleicons.org/pytorch/EE4C2C', url: 'https://pytorch.org' },
  'ml': { icon: 'https://cdn.simpleicons.org/tensorflow/FF6F00', url: 'https://www.tensorflow.org' },
  'ai': { icon: 'https://cdn.simpleicons.org/openai/412991', url: 'https://openai.com' },
  'openai': { icon: 'https://cdn.simpleicons.org/openai/412991', url: 'https://openai.com' },
  'huggingface': { icon: 'https://cdn.simpleicons.org/huggingface/FFD21E', url: 'https://huggingface.co' },
  'pandas': { icon: 'https://cdn.simpleicons.org/pandas/150458', url: 'https://pandas.pydata.org' },
  'numpy': { icon: 'https://cdn.simpleicons.org/numpy/013243', url: 'https://numpy.org' },
  
  // --- MOBILE & DESKTOP ---
  'react native': { icon: 'https://cdn.simpleicons.org/react/61DAFB', url: 'https://reactnative.dev' },
  'flutter': { icon: 'https://cdn.simpleicons.org/flutter/02569B', url: 'https://flutter.dev' },
  'swift': { icon: 'https://cdn.simpleicons.org/swift/F05138', url: 'https://developer.apple.com/swift/' },
  'kotlin': { icon: 'https://cdn.simpleicons.org/kotlin/7F52FF', url: 'https://kotlinlang.org' },
  'electron': { icon: 'https://cdn.simpleicons.org/electron/47848F', url: 'https://www.electronjs.org' }
};

export const getTechData = (tech) => {
  const t = tech.toLowerCase().trim();
  // Attempt strict match
  if (TECH_DICTIONARY[t]) return TECH_DICTIONARY[t];
  
  // Fallback fuzzing for compound terms (e.g., "AI/ML")
  if (t.includes('ai') || t.includes('ml')) return TECH_DICTIONARY['ai'];
  
  // Fallback fuzzing for node.js / react
  if (t.includes('node')) return TECH_DICTIONARY['node'];
  if (t.includes('react')) return TECH_DICTIONARY['react'];
  
  // Empty fallback so UI doesn't crash, redirects to general dev search
  // Uses a completely transparent pixel pattern if icon is totally unavailable
  return { 
    icon: null, 
    url: `https://devdocs.io/search?q=${encodeURIComponent(tech)}` 
  };
};
