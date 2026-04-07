/**
 * Script untuk menghapus komentar dari file HTML dan JavaScript
 * - Komentar HTML: <!-- ... -->
 * - Komentar JS inline: // ...
 * 
 * Script ini dibuat hati-hati untuk TIDAK menghapus:
 * - String yang mengandung // (seperti URL: https://example.com)
 * - String yang mengandung <!-- (seperti: const html = '<!--')
 * - Template literal yang mengandung karakter komentar
 * - String yang di-escape
 * 
 * Penggunaan:
 *   node scripts/remove-comments.js <file>        # Proses satu file
 *   node scripts/remove-comments.js <dir>          # Proses semua file di direktori
 *   node scripts/remove-comments.js public/        # Contoh: proses semua file HTML di public/
 *   node scripts/remove-comments.js --dry-run      # Preview tanpa mengubah file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

const DRY_RUN = process.argv.includes('--dry-run');

// Get target: last argument that's not a flag
const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
const target = args[0];

if (!target) {
  console.error('Usage: node scripts/remove-comments.js <file|directory>');
  console.error('  --dry-run    Preview without modifying files');
  process.exit(1);
}

const fullPath = path.isAbsolute(target) ? target : path.join(projectRoot, target);

if (!fs.existsSync(fullPath)) {
  console.error(`Error: Path not found: ${fullPath}`);
  process.exit(1);
}

/**
 * Mendapatkan daftar file yang akan diproses
 */
function getFiles(targetPath) {
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    return [targetPath];
  }

  const files = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      
      // Skip node_modules dan folder tersembunyi
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.js'))) {
        files.push(full);
      }
    }
  }
  walk(targetPath);
  return files;
}

/**
 * Menghapus komentar JS (// dan /* ... */) dengan aman
 * TIDAK menghapus // yang ada di dalam string literal atau URL
 */
function removeJsComments(content) {
  let result = '';
  let i = 0;
  const len = content.length;

  while (i < len) {
    const char = content[i];
    const nextChar = content[i + 1] || '';

    // Handle string literal - skip semua isi string
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      result += char;
      i++;

      while (i < len) {
        if (content[i] === '\\') {
          // Escape character - ambil 2 karakter
          result += content[i] + (content[i + 1] || '');
          i += 2;
          continue;
        }
        result += content[i];
        if (content[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // Handle komentar block /* ... */
    if (char === '/' && nextChar === '*') {
      const endIdx = content.indexOf('*/', i + 2);
      if (endIdx !== -1) {
        // Ganti dengan spasi
        result += ' ';
        i = endIdx + 2;
        continue;
      }
    }

    // Handle komentar line //
    if (char === '/' && nextChar === '/') {
      // Cek apakah ini URL (http:// atau https://)
      if (i > 0 && (content[i - 1] === ':' || (i > 1 && content[i - 2] === ':'))) {
        // Ini bagian dari URL, jangan hapus
        result += char;
        i++;
        continue;
      }
      
      // Skip sampai akhir baris
      while (i < len && content[i] !== '\n') {
        i++;
      }
      continue;
    }

    result += char;
    i++;
  }

  // Bersihkan baris kosong yang berlebihan (max 2 newline berturut-turut)
  result = result.replace(/\n{4,}/g, '\n\n\n');

  return result;
}

/**
 * Menghapus komentar HTML dengan aman
 * Tidak menghapus <!-- di dalam string literal
 */
function removeHtmlComments(content) {
  let result = '';
  let i = 0;
  const len = content.length;

  while (i < len) {
    // Cek apakah kita di dalam string
    const char = content[i];

    // Handle string literal - skip semua isi string
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      result += char;
      i++;

      while (i < len) {
        if (content[i] === '\\') {
          // Escape character - ambil 2 karakter
          result += content[i] + (content[i + 1] || '');
          i += 2;
          continue;
        }
        result += content[i];
        if (content[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // Cek komentar HTML
    if (content.substring(i, i + 4) === '<!--') {
      const endIdx = content.indexOf('-->', i + 4);
      if (endIdx !== -1) {
        // Skip komentar HTML (ganti dengan spasi agar tidak menggabungkan token)
        result += ' ';
        i = endIdx + 3;
        continue;
      }
    }

    result += char;
    i++;
  }

  return result;
}

/**
 * Proses satu file - tentukan apakah konten HTML atau JS
 * Untuk HTML: hapus komentar HTML dan JS di tag <script>
 * Untuk JS murni: hapus komentar JS
 */
function processContent(content, isHtml) {
  if (isHtml) {
    // Hapus komentar HTML dulu
    let result = removeHtmlComments(content);

    // Hapus komentar JS di dalam tag <script>
    result = result.replace(/<script([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, code) => {
      const cleaned = removeJsComments(code);
      return `<script${attrs}>${cleaned}</script>`;
    });

    return result;
  } else {
    // JS murni - hapus komentar JS
    return removeJsComments(content);
  }
}

/**
 * Proses satu file dan simpan hasilnya
 */
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const isHtml = filePath.endsWith('.html');

  const original = content;
  const processed = processContent(content, isHtml);

  const removed = original.length - processed.length;

  if (removed === 0) {
    console.log(`  ⏭️  (tidak ada komentar) ${path.relative(projectRoot, filePath)}`);
    return;
  }

  if (DRY_RUN) {
    console.log(`  🔍 DRY-RUN: ${path.relative(projectRoot, filePath)} (-${removed} chars)`);
    return;
  }

  fs.writeFileSync(filePath, processed, 'utf-8');
  console.log(`  ✂️  ${path.relative(projectRoot, filePath)} (-${removed} chars)`);
}

// Main
console.log(`${DRY_RUN ? '🔍 DRY RUN' : '✂️  Processing'} files...\n`);

const files = getFiles(fullPath);
if (files.length === 0) {
  console.log('No HTML/JS files found.');
  process.exit(0);
}

for (const file of files) {
  processFile(file);
}

console.log(`\n${DRY_RUN ? '🔍' : '✅'} Done! Processed ${files.length} file(s).`);
if (DRY_RUN) {
  console.log('Remove --dry-run to actually modify files.');
}
