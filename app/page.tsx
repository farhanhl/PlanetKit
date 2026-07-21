'use client';

import { useState, useEffect } from 'react';
import {
  FileImage,
  FilePlus,
  FileText,
  Layers,
  Scissors,
  RotateCw,
  ArrowUpDown,
  Minimize2,
  Info,
  QrCode,
  Hash,
  Droplets,
  Code,
  Maximize2,
  ImageMinus,
  AlignJustify,
  Crop,
  Download,
  FileDown,
  FileUp,
  Eraser,
  Lock,
  FileSpreadsheet,
  Image,
  ScanText,
  Pen,
  Search,
  FileCode,
  Type,
  Binary,
  Fingerprint,
  KeyRound,
  Pipette,
  Link2,
  Braces,
  TestTube2,
  Palette,
  ShieldCheck,
  Clock,
  Presentation,
  GitCompare,
  LayersIcon,
  Trash2,
  Paintbrush,
  Wrench,
  TextCursorInput,
  TrendingUp,
  HardDrive,
  Sparkles,
  EyeOff,
  ArrowLeftRight,
  ScanLine,
  FileCode2,
  Link,
  ImageIcon,
  Eye,
  Globe,
  Share2,
  FileSearch,
  X,
} from 'lucide-react';
import ToolCard from './components/ToolCard';
import ParallaxBackground from './components/ParallaxBackground';
import { useLang } from '@/app/lib/i18n/context';

const tabs = [
  'All',
  'Convert',
  'Edit',
  'Enhance',
  'Optimize',
  'Download',
  'Utilities',
] as const;
type Tab = (typeof tabs)[number];

interface Tool {
  href: string;
  icon: typeof FileImage;
  titleKey: string;
  descKey: string;
  category: Tab;
  anim: string;
}

const categoryColors: Record<Tab, string> = {
  All:       '#D4A853',
  Convert:   '#60A5FA',
  Edit:      '#34D399',
  Enhance:   '#A78BFA',
  Optimize:  '#FBBF24',
  Download:  '#F472B6',
  Utilities: '#22D3EE',
};

const toolDefs = [
  // Convert
  {
    href: '/tools/pdf-to-image',
    icon: FileImage,
    category: 'Convert' as Tab,
    titleKey: 'pdfToImage.title',
    descKey: 'pdfToImage.desc',
    anim: 'anim-slide-down',
  },
  {
    href: '/tools/image-to-pdf',
    icon: FilePlus,
    category: 'Convert' as Tab,
    titleKey: 'imageToPdf.title',
    descKey: 'imageToPdf.desc',
    anim: 'anim-stack',
  },
  {
    href: '/tools/pdf-to-text',
    icon: FileText,
    category: 'Convert' as Tab,
    titleKey: 'pdfToText.title',
    descKey: 'pdfToText.desc',
    anim: 'anim-type-cursor',
  },
  {
    href: '/tools/pdf-ocr',
    icon: ScanText,
    category: 'Convert' as Tab,
    titleKey: 'pdfOcrCard.title',
    descKey: 'pdfOcrCard.desc',
    anim: 'anim-scan',
  },
  {
    href: '/tools/html-to-pdf',
    icon: Code,
    category: 'Convert' as Tab,
    titleKey: 'htmlToPdf.title',
    descKey: 'htmlToPdf.desc',
    anim: 'anim-type-cursor',
  },
  {
    href: '/tools/pdf-to-docx',
    icon: FileDown,
    category: 'Convert' as Tab,
    titleKey: 'pdfToDocx.title',
    descKey: 'pdfToDocx.desc',
    anim: 'anim-slide-down',
  },
  {
    href: '/tools/docx-to-pdf',
    icon: FileUp,
    category: 'Convert' as Tab,
    titleKey: 'docxToPdf.title',
    descKey: 'docxToPdf.desc',
    anim: 'anim-slide-up',
  },
  {
    href: '/tools/pdf-to-excel',
    icon: FileSpreadsheet,
    category: 'Convert' as Tab,
    titleKey: 'pdfToExcelCard.title',
    descKey: 'pdfToExcelCard.desc',
    anim: 'anim-grid',
  },
  {
    href: '/tools/convert-image',
    icon: Image,
    category: 'Convert' as Tab,
    titleKey: 'imageConvertCard.title',
    descKey: 'imageConvertCard.desc',
    anim: 'anim-hue',
  },
  {
    href: '/tools/text-to-pdf',
    icon: Type,
    category: 'Convert' as Tab,
    titleKey: 'textToPdfCard.title',
    descKey: 'textToPdfCard.desc',
    anim: 'anim-type-cursor',
  },
  {
    href: '/tools/markdown-to-pdf',
    icon: FileCode,
    category: 'Convert' as Tab,
    titleKey: 'markdownToPdfCard.title',
    descKey: 'markdownToPdfCard.desc',
    anim: 'anim-type-cursor',
  },
  {
    href: '/tools/image-to-text',
    icon: ScanText,
    category: 'Convert' as Tab,
    titleKey: 'imgOcrCard.title',
    descKey: 'imgOcrCard.desc',
    anim: 'anim-scan',
  },
  {
    href: '/tools/csv-to-excel',
    icon: FileSpreadsheet,
    category: 'Convert' as Tab,
    titleKey: 'csvToExcelCard.title',
    descKey: 'csvToExcelCard.desc',
    anim: 'anim-grid',
  },
  {
    href: '/tools/excel-to-csv',
    icon: FileSpreadsheet,
    category: 'Convert' as Tab,
    titleKey: 'excelToCsvCard.title',
    descKey: 'excelToCsvCard.desc',
    anim: 'anim-grid',
  },
  {
    href: '/tools/pdf-to-ppt',
    icon: Presentation,
    category: 'Convert' as Tab,
    titleKey: 'pdfToPptCard.title',
    descKey: 'pdfToPptCard.desc',
    anim: 'anim-slide-tr',
  },
  {
    href: '/tools/ppt-to-pdf',
    icon: FileUp,
    category: 'Convert' as Tab,
    titleKey: 'pptToPdfCard.title',
    descKey: 'pptToPdfCard.desc',
    anim: 'anim-slide-up',
  },
  {
    href: '/tools/svg-to-png',
    icon: Image,
    category: 'Convert' as Tab,
    titleKey: 'svgToPngCard.title',
    descKey: 'svgToPngCard.desc',
    anim: 'anim-hue',
  },
  {
    href: '/tools/code-image',
    icon: ImageIcon,
    category: 'Convert' as Tab,
    titleKey: 'codeImageCard.title',
    descKey: 'codeImageCard.desc',
    anim: 'anim-sparkle',
  },
  // Edit
  {
    href: '/tools/merge-pdf',
    icon: Layers,
    category: 'Edit' as Tab,
    titleKey: 'mergePdf.title',
    descKey: 'mergePdf.desc',
    anim: 'anim-stack',
  },
  {
    href: '/tools/split-pdf',
    icon: Scissors,
    category: 'Edit' as Tab,
    titleKey: 'splitPdf.title',
    descKey: 'splitPdf.desc',
    anim: 'anim-scissor',
  },
  {
    href: '/tools/rotate-pdf',
    icon: RotateCw,
    category: 'Edit' as Tab,
    titleKey: 'rotatePdf.title',
    descKey: 'rotatePdf.desc',
    anim: 'anim-spin',
  },
  {
    href: '/tools/reorder-pdf',
    icon: ArrowUpDown,
    category: 'Edit' as Tab,
    titleKey: 'reorderPdf.title',
    descKey: 'reorderPdf.desc',
    anim: 'anim-bounce-ud',
  },
  {
    href: '/tools/encrypt-pdf',
    icon: Lock,
    category: 'Edit' as Tab,
    titleKey: 'encryptPdfCard.title',
    descKey: 'encryptPdfCard.desc',
    anim: 'anim-lock',
  },
  {
    href: '/tools/pdf-encrypt',
    icon: Lock,
    category: 'Edit' as Tab,
    titleKey: 'pdfEncryptCard.title',
    descKey: 'pdfEncryptCard.desc',
    anim: 'anim-lock',
  },
  {
    href: '/tools/delete-pages',
    icon: Trash2,
    category: 'Edit' as Tab,
    titleKey: 'deletePagesCard.title',
    descKey: 'deletePagesCard.desc',
    anim: 'anim-shake',
  },
  {
    href: '/tools/redact-pdf',
    icon: EyeOff,
    category: 'Edit' as Tab,
    titleKey: 'redactPdfCard.title',
    descKey: 'redactPdfCard.desc',
    anim: 'anim-blink',
  },
  // Enhance
  {
    href: '/tools/page-numbers',
    icon: Hash,
    category: 'Enhance' as Tab,
    titleKey: 'pageNumbers.title',
    descKey: 'pageNumbers.desc',
    anim: 'anim-bounce-ud',
  },
  {
    href: '/tools/watermark',
    icon: Droplets,
    category: 'Enhance' as Tab,
    titleKey: 'watermark.title',
    descKey: 'watermark.desc',
    anim: 'anim-drip',
  },
  {
    href: '/tools/header-footer',
    icon: AlignJustify,
    category: 'Enhance' as Tab,
    titleKey: 'headerFooter.title',
    descKey: 'headerFooter.desc',
    anim: 'anim-slide-down',
  },
  {
    href: '/tools/crop-pdf',
    icon: Crop,
    category: 'Enhance' as Tab,
    titleKey: 'cropPdf.title',
    descKey: 'cropPdf.desc',
    anim: 'anim-crop',
  },
  {
    href: '/tools/resize-pdf',
    icon: Maximize2,
    category: 'Enhance' as Tab,
    titleKey: 'resizePdf.title',
    descKey: 'resizePdf.desc',
    anim: 'anim-scale',
  },
  {
    href: '/tools/remove-bg',
    icon: Eraser,
    category: 'Enhance' as Tab,
    titleKey: 'removeBg.title',
    descKey: 'removeBg.desc',
    anim: 'anim-erase',
  },
  {
    href: '/tools/sign-pdf',
    icon: Pen,
    category: 'Enhance' as Tab,
    titleKey: 'signPdfCard.title',
    descKey: 'signPdfCard.desc',
    anim: 'anim-write',
  },
  {
    href: '/tools/image-resize',
    icon: Crop,
    category: 'Enhance' as Tab,
    titleKey: 'resizeImageCard.title',
    descKey: 'resizeImageCard.desc',
    anim: 'anim-scale',
  },
  {
    href: '/tools/pdf-flatten',
    icon: LayersIcon,
    category: 'Enhance' as Tab,
    titleKey: 'pdfFlattenCard.title',
    descKey: 'pdfFlattenCard.desc',
    anim: 'anim-flatten',
  },
  {
    href: '/tools/pdf-background',
    icon: Paintbrush,
    category: 'Enhance' as Tab,
    titleKey: 'pdfBgCard.title',
    descKey: 'pdfBgCard.desc',
    anim: 'anim-paint',
  },
  {
    href: '/tools/image-filters',
    icon: Sparkles,
    category: 'Enhance' as Tab,
    titleKey: 'imageFiltersCard.title',
    descKey: 'imageFiltersCard.desc',
    anim: 'anim-sparkle',
  },
  // Optimize
  {
    href: '/tools/compress-pdf',
    icon: Minimize2,
    category: 'Optimize' as Tab,
    titleKey: 'compressPdf.title',
    descKey: 'compressPdf.desc',
    anim: 'anim-shrink',
  },
  {
    href: '/tools/compress-image',
    icon: ImageMinus,
    category: 'Optimize' as Tab,
    titleKey: 'compressImage.title',
    descKey: 'compressImage.desc',
    anim: 'anim-shrink',
  },
  // Download
  {
    href: '/tools/social-downloader',
    icon: Download,
    category: 'Download' as Tab,
    titleKey: 'socialDownloader.title',
    descKey: 'socialDownloader.desc',
    anim: 'anim-bounce-down',
  },
  {
    href: '/tools/terabox-downloader',
    icon: HardDrive,
    category: 'Download' as Tab,
    titleKey: 'teraBox.title',
    descKey: 'teraBox.desc',
    anim: 'anim-pulse-ring',
  },
  {
    href: '/tools/canva-premium',
    icon: Palette,
    category: 'Download' as Tab,
    titleKey: 'canvaCard.title',
    descKey: 'canvaCard.desc',
    anim: 'anim-hue',
  },
  // Utilities
  {
    href: '/tools/pdf-metadata',
    icon: Info,
    category: 'Utilities' as Tab,
    titleKey: 'pdfMetadata.title',
    descKey: 'pdfMetadata.desc',
    anim: 'anim-pulse-ring',
  },
  {
    href: '/tools/qr-code',
    icon: QrCode,
    category: 'Utilities' as Tab,
    titleKey: 'qrCode.title',
    descKey: 'qrCode.desc',
    anim: 'anim-scan',
  },
  {
    href: '/tools/base64',
    icon: Binary,
    category: 'Utilities' as Tab,
    titleKey: 'base64Card.title',
    descKey: 'base64Card.desc',
    anim: 'anim-glitch',
  },
  {
    href: '/tools/hash-generator',
    icon: Fingerprint,
    category: 'Utilities' as Tab,
    titleKey: 'hashCard.title',
    descKey: 'hashCard.desc',
    anim: 'anim-pulse-ring',
  },
  {
    href: '/tools/password-generator',
    icon: KeyRound,
    category: 'Utilities' as Tab,
    titleKey: 'passwordGenCard.title',
    descKey: 'passwordGenCard.desc',
    anim: 'anim-shake',
  },
  {
    href: '/tools/color-picker',
    icon: Pipette,
    category: 'Utilities' as Tab,
    titleKey: 'colorPickerCard.title',
    descKey: 'colorPickerCard.desc',
    anim: 'anim-hue',
  },
  {
    href: '/tools/url-encoder',
    icon: Link2,
    category: 'Utilities' as Tab,
    titleKey: 'urlEncoderCard.title',
    descKey: 'urlEncoderCard.desc',
    anim: 'anim-stretch',
  },
  {
    href: '/tools/json-formatter',
    icon: Braces,
    category: 'Utilities' as Tab,
    titleKey: 'jsonCard.title',
    descKey: 'jsonCard.desc',
    anim: 'anim-type-cursor',
  },
  {
    href: '/tools/timestamp-converter',
    icon: Clock,
    category: 'Utilities' as Tab,
    titleKey: 'timestampCard.title',
    descKey: 'timestampCard.desc',
    anim: 'anim-tick',
  },
  {
    href: '/tools/regex-tester',
    icon: TestTube2,
    category: 'Utilities' as Tab,
    titleKey: 'regexCard.title',
    descKey: 'regexCard.desc',
    anim: 'anim-bounce-ud',
  },
  {
    href: '/tools/color-converter',
    icon: Palette,
    category: 'Utilities' as Tab,
    titleKey: 'colorConvCard.title',
    descKey: 'colorConvCard.desc',
    anim: 'anim-hue',
  },
  {
    href: '/tools/password-strength',
    icon: ShieldCheck,
    category: 'Utilities' as Tab,
    titleKey: 'pwStrengthCard.title',
    descKey: 'pwStrengthCard.desc',
    anim: 'anim-shield',
  },
  {
    href: '/tools/image-exif',
    icon: Info,
    category: 'Utilities' as Tab,
    titleKey: 'exifCard.title',
    descKey: 'exifCard.desc',
    anim: 'anim-pulse-ring',
  },
  {
    href: '/tools/pdf-compare',
    icon: GitCompare,
    category: 'Utilities' as Tab,
    titleKey: 'pdfCompareCard.title',
    descKey: 'pdfCompareCard.desc',
    anim: 'anim-compare',
  },
  {
    href: '/tools/repair-pdf',
    icon: Wrench,
    category: 'Utilities' as Tab,
    titleKey: 'repairPdfCard.title',
    descKey: 'repairPdfCard.desc',
    anim: 'anim-wrench',
  },
  {
    href: '/tools/word-counter',
    icon: TextCursorInput,
    category: 'Utilities' as Tab,
    titleKey: 'wordCounterCard.title',
    descKey: 'wordCounterCard.desc',
    anim: 'anim-type-cursor',
  },
  {
    href: '/tools/text-diff',
    icon: GitCompare,
    category: 'Utilities' as Tab,
    titleKey: 'textDiffCard.title',
    descKey: 'textDiffCard.desc',
    anim: 'anim-compare',
  },
  {
    href: '/tools/yaml-json',
    icon: ArrowLeftRight,
    category: 'Utilities' as Tab,
    titleKey: 'yamlJsonCard.title',
    descKey: 'yamlJsonCard.desc',
    anim: 'anim-compare',
  },
  {
    href: '/tools/qr-scanner',
    icon: ScanLine,
    category: 'Utilities' as Tab,
    titleKey: 'qrScannerCard.title',
    descKey: 'qrScannerCard.desc',
    anim: 'anim-scan',
  },
  {
    href: '/tools/markdown-preview',
    icon: FileCode2,
    category: 'Utilities' as Tab,
    titleKey: 'mdPreviewCard.title',
    descKey: 'mdPreviewCard.desc',
    anim: 'anim-type-cursor',
  },
  {
    href: '/tools/text-slug',
    icon: Link,
    category: 'Utilities' as Tab,
    titleKey: 'slugCard.title',
    descKey: 'slugCard.desc',
    anim: 'anim-stretch',
  },
  {
    href: '/tools/lorem-ipsum',
    icon: Type,
    category: 'Utilities' as Tab,
    titleKey: 'loremCard.title',
    descKey: 'loremCard.desc',
    anim: 'anim-type-cursor',
  },
  {
    href: '/tools/jwt-decoder',
    icon: KeyRound,
    category: 'Utilities' as Tab,
    titleKey: 'jwtCard.title',
    descKey: 'jwtCard.desc',
    anim: 'anim-lock',
  },
  {
    href: '/tools/css-gradient',
    icon: Paintbrush,
    category: 'Utilities' as Tab,
    titleKey: 'gradientCard.title',
    descKey: 'gradientCard.desc',
    anim: 'anim-paint',
  },
  {
    href: '/tools/css-shadow',
    icon: Layers,
    category: 'Utilities' as Tab,
    titleKey: 'shadowCard.title',
    descKey: 'shadowCard.desc',
    anim: 'anim-stack',
  },
  {
    href: '/tools/color-palette',
    icon: Palette,
    category: 'Utilities' as Tab,
    titleKey: 'paletteCard.title',
    descKey: 'paletteCard.desc',
    anim: 'anim-hue',
  },
  {
    href: '/tools/contrast-checker',
    icon: Eye,
    category: 'Utilities' as Tab,
    titleKey: 'contrastCard.title',
    descKey: 'contrastCard.desc',
    anim: 'anim-blink',
  },
  {
    href: '/tools/html-playground',
    icon: Code,
    category: 'Utilities' as Tab,
    titleKey: 'playgroundCard.title',
    descKey: 'playgroundCard.desc',
    anim: 'anim-type-cursor',
  },
  {
    href: '/tools/image-metadata-remover',
    icon: FileSearch,
    category: 'Enhance' as Tab,
    titleKey: 'metaRemoverCard.title',
    descKey: 'metaRemoverCard.desc',
    anim: 'anim-scan',
  },
  {
    href: '/tools/favicon-generator',
    icon: Globe,
    category: 'Convert' as Tab,
    titleKey: 'faviconCard.title',
    descKey: 'faviconCard.desc',
    anim: 'anim-spin-slow',
  },
  {
    href: '/tools/og-image',
    icon: Share2,
    category: 'Convert' as Tab,
    titleKey: 'ogCard.title',
    descKey: 'ogCard.desc',
    anim: 'anim-share',
  },
  {
    href: '/tools/invoice-generator',
    icon: FileText,
    category: 'Convert' as Tab,
    titleKey: 'invoiceCard.title',
    descKey: 'invoiceCard.desc',
    anim: 'anim-slide-down',
  },
  {
    href: '/tools/ascii-art',
    icon: Type,
    category: 'Convert' as Tab,
    titleKey: 'asciiCard.title',
    descKey: 'asciiCard.desc',
    anim: 'anim-glitch',
  },
];

function getNested(obj: Record<string, unknown>, path: string): string {
  return path.split('.').reduce((acc: unknown, key: string) => {
    if (
      acc &&
      typeof acc === 'object' &&
      key in (acc as Record<string, unknown>)
    ) {
      return (acc as Record<string, unknown>)[key];
    }
    return path;
  }, obj) as string;
}

export default function Home() {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [search, setSearch] = useState('');
  const [sortByPopular, setSortByPopular] = useState(false);
  const [popularMap, setPopularMap] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    fetch('/api/analytics/popular')
      .then((r) => r.json())
      .then((data) => {
        const map = new Map<string, number>();
        for (const item of data.popular || []) {
          map.set(item.slug, item.count);
        }
        setPopularMap(map);
      })
      .catch(() => {});
  }, []);

  const tabLabels: Record<Tab, string> = {
    All: t.tabAll,
    Convert: t.tabConvert,
    Edit: t.tabEdit,
    Enhance: t.tabEnhance,
    Optimize: t.tabOptimize,
    Download: t.tabDownload,
    Utilities: t.tabUtilities,
  };

  const tools: Tool[] = toolDefs.map((d) => ({
    ...d,
    titleKey: getNested(t, d.titleKey) || d.titleKey,
    descKey: getNested(t, d.descKey) || d.descKey,
  }));

  const filtered = tools.filter((tc) => {
    const matchesTab = activeTab === 'All' || tc.category === activeTab;
    if (!search) return matchesTab;
    const q = search.toLowerCase();
    return (
      matchesTab &&
      (tc.titleKey.toLowerCase().includes(q) ||
        tc.descKey.toLowerCase().includes(q))
    );
  });

  const sorted = sortByPopular
    ? [...filtered].sort((a, b) => {
        const slugA = a.href.split('/').pop() || '';
        const slugB = b.href.split('/').pop() || '';
        return (popularMap.get(slugB) || 0) - (popularMap.get(slugA) || 0);
      })
    : filtered;

  return (
    <>
      <ParallaxBackground />
      <div className='relative z-10 mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8'>
        <div className='mx-auto max-w-2xl text-center'>
        <h1 className='text-3xl font-bold tracking-tight text-foreground sm:text-5xl'>
          {t.heroLine1}
          <br />
          <span className='text-accent'>{t.heroLine2}</span>
        </h1>
        <p className='mt-4 text-base text-text-secondary sm:text-lg'>
          {t.heroDesc}
        </p>
      </div>

      <div className='mx-auto mt-12 max-w-5xl'>
        <div className='relative mb-6'>
          <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary' />
          <input
            type='text'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchTools}
            className='w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-text-secondary/50 transition-colors focus:border-accent focus:outline-none'
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className='absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-secondary hover:text-foreground'
            >
              <X className='h-4 w-4' />
            </button>
          )}
        </div>

        <div className='mb-8 flex gap-2 overflow-x-auto pb-2'>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-text-secondary hover:border-accent/40 hover:text-foreground'
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
          {popularMap.size > 0 && (
            <button
              onClick={() => setSortByPopular(!sortByPopular)}
              className={`shrink-0 flex cursor-pointer items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                sortByPopular
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-text-secondary hover:border-accent/40 hover:text-foreground'
              }`}
            >
              <TrendingUp className='h-3.5 w-3.5' />
              {t.tabPopular}
            </button>
          )}
        </div>

        <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
          {sorted.map((tool, i) => (
            <ToolCard
              key={tool.href}
              href={tool.href}
              icon={tool.icon}
              title={tool.titleKey}
              description={tool.descKey}
              color={categoryColors[tool.category]}
              anim={tool.anim}
              index={i}
            />
          ))}
        </div>

        {sorted.length === 0 && (
          <p className='mt-8 text-center text-sm text-text-secondary'>
            {t.noResults}
          </p>
        )}
      </div>
    </div>
    </>
  );
}
