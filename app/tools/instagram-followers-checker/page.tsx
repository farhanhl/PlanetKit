"use client";

import { useState, useMemo } from "react";
import JSZip from "jszip";
import {
  UserCheck,
  UserX,
  UserPlus,
  Users,
  Upload,
  FileArchive,
  Search,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
  ArrowUpDown,
  CheckCircle2,
} from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

interface UserEntry {
  username: string;
  timestamp: number;
}

type TabType = "notFollowingBack" | "notFollowedByMe" | "mutual" | "allFollowing" | "allFollowers";
type SortOption = "date-desc" | "date-asc" | "name-asc" | "name-desc";

export default function InstagramFollowersCheckerPage() {
  const { lang } = useLang();
  const isIndo = lang === "id";

  // State inputs
  const [followersMap, setFollowersMap] = useState<Map<string, number>>(new Map());
  const [followingMap, setFollowingMap] = useState<Map<string, number>>(new Map());
  const [zipFileName, setZipFileName] = useState<string>("");
  
  // Loading & Error states
  const [isProcessingZip, setIsProcessingZip] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [hasProcessed, setHasProcessed] = useState<boolean>(false);

  // Table controls state
  const [activeTab, setActiveTab] = useState<TabType>("notFollowingBack");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<SortOption>("date-desc");
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);

  // Recursive parser to extract Username & Timestamp from Instagram/Meta JSON export inside ZIP
  const extractUserData = (jsonObj: any): Map<string, number> => {
    const userMap = new Map<string, number>();

    function walk(node: any) {
      if (!node || typeof node !== "object") return;

      // Meta standard schema: string_list_data
      if (node.string_list_data && Array.isArray(node.string_list_data)) {
        node.string_list_data.forEach((item: any) => {
          let uname: string | null = null;
          if (item.value) {
            uname = item.value.toLowerCase().trim();
          } else if (item.href) {
            const parts = item.href.replace(/\/$/, "").split("/");
            const lastPart = parts[parts.length - 1];
            if (lastPart && lastPart !== "instagram.com" && lastPart !== "www.instagram.com") {
              uname = lastPart.toLowerCase().trim();
            }
          }

          if (uname) {
            const ts = Number(item.timestamp) || 0;
            if (!userMap.has(uname) || (userMap.get(uname) ?? 0) < ts) {
              userMap.set(uname, ts);
            }
          }
        });
      }

      // Alternative legacy schema
      if (typeof node.value === "string" && node.value && (node.timestamp || node.href)) {
        const uname = node.value.toLowerCase().trim();
        const ts = Number(node.timestamp) || 0;
        if (!userMap.has(uname) || (userMap.get(uname) ?? 0) < ts) {
          userMap.set(uname, ts);
        }
      }

      if (Array.isArray(node)) {
        node.forEach((item) => walk(item));
      } else {
        Object.keys(node).forEach((key) => walk(node[key]));
      }
    }

    walk(jsonObj);
    return userMap;
  };

  // Handle ZIP file upload
  const handleZipUpload = async (file: File) => {
    setErrorMessage(null);
    setIsProcessingZip(true);
    setZipFileName(file.name);

    try {
      const zip = await JSZip.loadAsync(file);
      const newFollowersMap = new Map<string, number>();
      const newFollowingMap = new Map<string, number>();

      let foundFollowers = false;
      let foundFollowing = false;

      for (const relativePath of Object.keys(zip.files)) {
        const lowerPath = relativePath.toLowerCase();
        
        if (lowerPath.includes("followers") && lowerPath.endsWith(".json")) {
          const content = await zip.files[relativePath].async("text");
          try {
            const json = JSON.parse(content);
            const extracted = extractUserData(json);
            extracted.forEach((ts, uname) => newFollowersMap.set(uname, ts));
            foundFollowers = true;
          } catch (err) {
            console.error("Error parsing followers file in zip:", relativePath, err);
          }
        } else if (lowerPath.includes("following") && lowerPath.endsWith(".json")) {
          const content = await zip.files[relativePath].async("text");
          try {
            const json = JSON.parse(content);
            const extracted = extractUserData(json);
            extracted.forEach((ts, uname) => newFollowingMap.set(uname, ts));
            foundFollowing = true;
          } catch (err) {
            console.error("Error parsing following file in zip:", relativePath, err);
          }
        }
      }

      if (!foundFollowers && !foundFollowing) {
        setErrorMessage(
          isIndo
            ? "File followers_1.json atau following.json tidak ditemukan di dalam ZIP! Pastikan Anda memilih opsi 'Pengikut dan Mengikuti' saat mendownload data Instagram."
            : "No followers_1.json or following.json found inside the ZIP file. Please ensure you selected 'Followers and Following' when requesting your Instagram data."
        );
      } else {
        setFollowersMap(newFollowersMap);
        setFollowingMap(newFollowingMap);
        setHasProcessed(true);
      }
    } catch (err) {
      setErrorMessage(
        isIndo ? "Gagal mengekstrak file ZIP. Pastikan file ZIP valid dan tidak terenkripsi." : "Failed to extract ZIP archive. Please ensure it is a valid zip file."
      );
    } finally {
      setIsProcessingZip(false);
    }
  };

  // Reset all data
  const handleReset = () => {
    setFollowersMap(new Map());
    setFollowingMap(new Map());
    setZipFileName("");
    setHasProcessed(false);
    setErrorMessage(null);
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Calculate relationship lists
  const relationshipLists = useMemo(() => {
    const notFollowingBack: UserEntry[] = [];
    const notFollowedByMe: UserEntry[] = [];
    const mutual: UserEntry[] = [];
    const allFollowing: UserEntry[] = [];
    const allFollowers: UserEntry[] = [];

    followingMap.forEach((timestamp, username) => {
      allFollowing.push({ username, timestamp });
      if (!followersMap.has(username)) {
        notFollowingBack.push({ username, timestamp });
      } else {
        mutual.push({ username, timestamp });
      }
    });

    followersMap.forEach((timestamp, username) => {
      allFollowers.push({ username, timestamp });
      if (!followingMap.has(username)) {
        notFollowedByMe.push({ username, timestamp });
      }
    });

    return {
      notFollowingBack,
      notFollowedByMe,
      mutual,
      allFollowing,
      allFollowers,
    };
  }, [followersMap, followingMap]);

  // Current raw active list based on tab
  const activeRawList = useMemo(() => {
    switch (activeTab) {
      case "notFollowingBack":
        return relationshipLists.notFollowingBack;
      case "notFollowedByMe":
        return relationshipLists.notFollowedByMe;
      case "mutual":
        return relationshipLists.mutual;
      case "allFollowing":
        return relationshipLists.allFollowing;
      case "allFollowers":
        return relationshipLists.allFollowers;
      default:
        return relationshipLists.notFollowingBack;
    }
  }, [activeTab, relationshipLists]);

  // Filtered and sorted data
  const filteredAndSortedData = useMemo(() => {
    let list = [...activeRawList];
    const q = searchQuery.toLowerCase().trim();

    if (q) {
      list = list.filter((item) => item.username.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sortOption === "date-desc") return b.timestamp - a.timestamp;
      if (sortOption === "date-asc") return a.timestamp - b.timestamp;
      if (sortOption === "name-asc") return a.username.localeCompare(b.username);
      if (sortOption === "name-desc") return b.username.localeCompare(a.username);
      return 0;
    });

    return list;
  }, [activeRawList, searchQuery, sortOption]);

  // Pagination calculation
  const totalItems = filteredAndSortedData.length;
  const effectivePageSize = pageSize === -1 ? Math.max(totalItems, 1) : pageSize;
  const totalPages = Math.ceil(totalItems / effectivePageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * effectivePageSize;
  const endIndex = Math.min(startIndex + effectivePageSize, totalItems);
  const pageData = filteredAndSortedData.slice(startIndex, endIndex);

  // Helper date formatter
  const formatDate = (unixTs: number) => {
    if (!unixTs) return "-";
    return new Date(unixTs * 1000).toLocaleDateString(isIndo ? "id-ID" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Export handlers
  const handleCopyUsernames = async () => {
    const text = filteredAndSortedData.map((u) => `@${u.username}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCsv = () => {
    const headers = "Username,Date Followed,Timestamp\n";
    const rows = filteredAndSortedData
      .map((u) => `"${u.username}","${formatDate(u.timestamp)}",${u.timestamp}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `instagram_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(filteredAndSortedData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `instagram_${activeTab}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const title = isIndo ? "Cek Pengikut Instagram Offline" : "Instagram Follower Checker";
  const description = isIndo
    ? "Cek siapa yang tidak ikuti balik (unfollow), pengikut saling follow, dan statistik relasi akun Instagram secara aman, 100% offline tanpa login."
    : "Find unfollowers, who doesn't follow you back, and mutual followers safely and offline without login.";

  return (
    <>
      <ToolSeo title={title} description={description} path="/tools/instagram-followers-checker" />
      <ToolPageLayout title={title} description={description}>
        <div className="mx-auto max-w-6xl space-y-8">
          
          {/* Privacy & Safety Badge Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-accent/20 bg-accent/5 p-4 sm:p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-background font-bold">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {isIndo ? "100% Aman & Tanpa Login" : "100% Private & Safe - No Login Required"}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  {isIndo
                    ? "Seluruh data diproses secara lokal di browser Anda. Tidak ada data yang dikirim ke server."
                    : "All data is processed directly inside your browser. Nothing ever leaves your device."}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center gap-1.5 shrink-0 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-secondary transition-all hover:border-accent/40 hover:text-foreground"
            >
              <HelpCircle className="h-4 w-4 text-accent" />
              <span>{isIndo ? "Cara Mengunduh Data" : "How to Get Data ZIP"}</span>
              {showGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Guide Accordion */}
          {showGuide && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-lg transition-all animate-in fade-in slide-in-from-top-2">
              <h4 className="mb-4 text-base font-bold text-foreground flex items-center gap-2">
                <Info className="h-5 w-5 text-accent" />
                {isIndo ? "Panduan Langkah Mengunduh Data dari Instagram (Meta)" : "Step-by-step Guide to Download Data from Meta"}
              </h4>
              <ol className="grid gap-3 text-xs text-text-secondary sm:grid-cols-2 lg:grid-cols-3">
                <li className="rounded-xl border border-border/50 bg-background/50 p-3.5">
                  <span className="mb-1.5 inline-block rounded-md bg-accent/10 px-2 py-0.5 font-bold text-accent">1</span>
                  <p>{isIndo ? "Buka aplikasi Instagram di HP atau instagram.com di PC/Laptop." : "Open Instagram app or visit instagram.com."}</p>
                </li>
                <li className="rounded-xl border border-border/50 bg-background/50 p-3.5">
                  <span className="mb-1.5 inline-block rounded-md bg-accent/10 px-2 py-0.5 font-bold text-accent">2</span>
                  <p>{isIndo ? "Buka Profil → Menu (3 Garis) → Pusat Akun (Accounts Center)." : "Go to Profile → Menu → Accounts Center."}</p>
                </li>
                <li className="rounded-xl border border-border/50 bg-background/50 p-3.5">
                  <span className="mb-1.5 inline-block rounded-md bg-accent/10 px-2 py-0.5 font-bold text-accent">3</span>
                  <p>{isIndo ? "Pilih Informasi dan Izin Anda → Unduh Informasi Anda." : "Select 'Your Information and Permissions' → 'Download Your Information'."}</p>
                </li>
                <li className="rounded-xl border border-border/50 bg-background/50 p-3.5">
                  <span className="mb-1.5 inline-block rounded-md bg-accent/10 px-2 py-0.5 font-bold text-accent">4</span>
                  <p>{isIndo ? "Pilih Minta Unduhan → Sebagian Informasi (Select Types)." : "Click 'Request Download' → 'Select Types of Information'."}</p>
                </li>
                <li className="rounded-xl border border-border/50 bg-background/50 p-3.5">
                  <span className="mb-1.5 inline-block rounded-md bg-accent/10 px-2 py-0.5 font-bold text-accent">5</span>
                  <p>{isIndo ? "Centang opsi Pengikut dan Mengikuti (Followers and Following)." : "Check 'Followers and Following' option, then Next."}</p>
                </li>
                <li className="rounded-xl border border-border/50 bg-background/50 p-3.5">
                  <span className="mb-1.5 inline-block rounded-md bg-accent/10 px-2 py-0.5 font-bold text-accent">6</span>
                  <p className="font-semibold text-foreground">
                    {isIndo ? "Wajib pilih Format: JSON (Jangan HTML!) & Rentang Waktu: Semua Waktu." : "MUST select Format: JSON & Date Range: All Time."}
                  </p>
                </li>
              </ol>
              <div className="mt-4 rounded-xl border border-accent/20 bg-accent/5 p-3 text-xs text-text-secondary flex items-center justify-between">
                <span>
                  {isIndo
                    ? "Setelah Meta mengirimkan file .zip, Anda bisa langsung upload file ZIP tersebut di bawah ini tanpa perlu mengekstrak manual!"
                    : "Once Meta sends you the ZIP file, you can upload the ZIP file directly below without extracting it!"}
                </span>
              </div>
            </div>
          )}

          {/* Upload Section (ZIP Only) */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-6">
            
            {/* Header & Reset button */}
            <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <FileArchive className="h-5 w-5 text-accent" />
                <span className="text-sm font-semibold text-foreground">
                  {isIndo ? "Upload File ZIP Instagram Meta" : "Upload Instagram Export ZIP"}
                </span>
              </div>

              {hasProcessed && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-background/60 px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-error/40 hover:text-error transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>{isIndo ? "Reset Data" : "Reset Data"}</span>
                </button>
              )}
            </div>

            {/* Error Display */}
            {errorMessage && (
              <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-xs font-medium text-error flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ZIP Upload Dropzone */}
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center min-h-[180px] w-full cursor-pointer rounded-2xl border-2 border-dashed border-border bg-background/30 p-6 text-center transition-all hover:border-accent hover:bg-accent/5">
                <input
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleZipUpload(file);
                  }}
                />
                {isProcessingZip ? (
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="h-8 w-8 animate-spin text-accent" />
                    <p className="text-sm font-semibold text-foreground">
                      {isIndo ? "Mengekstrak dan membaca data ZIP..." : "Extracting and parsing ZIP contents..."}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {isIndo ? "Klik atau tarik file ZIP Instagram ke sini" : "Click or drag Instagram export ZIP file here"}
                      </p>
                      <p className="mt-1 text-xs text-text-secondary">
                        {isIndo ? "File ZIP langsung dari Meta (Tanpa perlu di-extract)" : "Direct ZIP file from Meta (No extraction needed)"}
                      </p>
                    </div>
                    {zipFileName && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-accent/20 px-3 py-1 text-xs font-medium text-accent">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{zipFileName}</span>
                      </div>
                    )}
                  </div>
                )}
              </label>
            </div>

          </div>

          {/* Results Container */}
          {hasProcessed && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Stat Cards Overview */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                
                <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-secondary">{isIndo ? "Tidak Follow Back" : "Not Following Back"}</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-error/10 text-error">
                      <UserX className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-error">{relationshipLists.notFollowingBack.length}</span>
                    <span className="text-xs text-text-secondary font-medium">
                      ({followingMap.size > 0 ? Math.round((relationshipLists.notFollowingBack.length / followingMap.size) * 100) : 0}% {isIndo ? "dari following" : "of following"})
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-secondary">{isIndo ? "Belum Anda Follow Back" : "Not Followed Back"}</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-warning/10 text-warning">
                      <UserPlus className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-foreground">{relationshipLists.notFollowedByMe.length}</span>
                    <span className="text-xs text-text-secondary font-medium">{isIndo ? "akun fans" : "fans"}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-secondary">{isIndo ? "Saling Follow (Mutual)" : "Mutual Followers"}</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-success/10 text-success">
                      <UserCheck className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-success">{relationshipLists.mutual.length}</span>
                    <span className="text-xs text-text-secondary font-medium">{isIndo ? "teman dekat" : "mutuals"}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-secondary">{isIndo ? "Total Relasi" : "Total Overview"}</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-foreground font-medium">
                    <span>Followers: <strong>{followersMap.size}</strong></span>
                    <span>Following: <strong>{followingMap.size}</strong></span>
                  </div>
                </div>

              </div>

              {/* Main Content Box */}
              <div className="rounded-2xl border border-border bg-surface shadow-xl overflow-hidden">
                
                {/* Tabs Bar */}
                <div className="flex border-b border-border bg-background/40 overflow-x-auto">
                  <button
                    onClick={() => { setActiveTab("notFollowingBack"); setCurrentPage(1); }}
                    className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-semibold transition-all whitespace-nowrap ${
                      activeTab === "notFollowingBack"
                        ? "border-accent text-accent bg-surface"
                        : "border-transparent text-text-secondary hover:text-foreground"
                    }`}
                  >
                    <UserX className="h-4 w-4" />
                    <span>{isIndo ? "Tidak Follow Back" : "Not Following Back"}</span>
                    <span className="rounded-full bg-error/10 px-2 py-0.5 text-[10px] font-bold text-error">
                      {relationshipLists.notFollowingBack.length}
                    </span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("notFollowedByMe"); setCurrentPage(1); }}
                    className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-semibold transition-all whitespace-nowrap ${
                      activeTab === "notFollowedByMe"
                        ? "border-accent text-accent bg-surface"
                        : "border-transparent text-text-secondary hover:text-foreground"
                    }`}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>{isIndo ? "Belum Anda Follow Back" : "Not Followed Back"}</span>
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                      {relationshipLists.notFollowedByMe.length}
                    </span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("mutual"); setCurrentPage(1); }}
                    className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-semibold transition-all whitespace-nowrap ${
                      activeTab === "mutual"
                        ? "border-accent text-accent bg-surface"
                        : "border-transparent text-text-secondary hover:text-foreground"
                    }`}
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>{isIndo ? "Saling Follow" : "Mutual Followers"}</span>
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                      {relationshipLists.mutual.length}
                    </span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("allFollowing"); setCurrentPage(1); }}
                    className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-semibold transition-all whitespace-nowrap ${
                      activeTab === "allFollowing"
                        ? "border-accent text-accent bg-surface"
                        : "border-transparent text-text-secondary hover:text-foreground"
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>{isIndo ? "Semua Following" : "All Following"}</span>
                    <span className="rounded-full bg-border px-2 py-0.5 text-[10px] font-bold text-text-secondary">
                      {relationshipLists.allFollowing.length}
                    </span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("allFollowers"); setCurrentPage(1); }}
                    className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-semibold transition-all whitespace-nowrap ${
                      activeTab === "allFollowers"
                        ? "border-accent text-accent bg-surface"
                        : "border-transparent text-text-secondary hover:text-foreground"
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>{isIndo ? "Semua Followers" : "All Followers"}</span>
                    <span className="rounded-full bg-border px-2 py-0.5 text-[10px] font-bold text-text-secondary">
                      {relationshipLists.allFollowers.length}
                    </span>
                  </button>
                </div>

                {/* Filter Controls & Actions */}
                <div className="p-4 sm:p-5 border-b border-border bg-surface space-y-4">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    
                    {/* Search Input */}
                    <div className="relative w-full md:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder={isIndo ? "Cari username..." : "Search username..."}
                        className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-xs font-medium text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
                      />
                    </div>

                    {/* Sorting & Rows per page */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap sm:flex-nowrap">
                      
                      <div className="flex items-center gap-1.5">
                        <ArrowUpDown className="h-3.5 w-3.5 text-text-secondary" />
                        <select
                          value={sortOption}
                          onChange={(e) => setSortOption(e.target.value as SortOption)}
                          className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-accent focus:outline-none"
                        >
                          <option value="date-desc">{isIndo ? "Waktu: Terbaru → Terlama" : "Date: Newest → Oldest"}</option>
                          <option value="date-asc">{isIndo ? "Waktu: Terlama → Terbaru" : "Date: Oldest → Newest"}</option>
                          <option value="name-asc">{isIndo ? "Nama: A - Z" : "Name: A - Z"}</option>
                          <option value="name-desc">{isIndo ? "Nama: Z - A" : "Name: Z - A"}</option>
                        </select>
                      </div>

                      <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                        className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-accent focus:outline-none"
                      >
                        <option value={10}>{isIndo ? "10 per halaman" : "10 per page"}</option>
                        <option value={25}>{isIndo ? "25 per halaman" : "25 per page"}</option>
                        <option value={50}>{isIndo ? "50 per halaman" : "50 per page"}</option>
                        <option value={100}>{isIndo ? "100 per halaman" : "100 per page"}</option>
                        <option value={-1}>{isIndo ? "Tampilkan Semua" : "Show All"}</option>
                      </select>

                    </div>
                  </div>

                  {/* Export Action Buttons */}
                  <div className="flex items-center justify-between border-t border-border/50 pt-3 flex-wrap gap-2 text-xs text-text-secondary">
                    <span>
                      {isIndo
                        ? `Menampilkan ${totalItems === 0 ? 0 : startIndex + 1} - ${endIndex} dari ${totalItems} akun`
                        : `Showing ${totalItems === 0 ? 0 : startIndex + 1} - ${endIndex} of ${totalItems} accounts`}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyUsernames}
                        disabled={totalItems === 0}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-background/50 px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-accent/40 hover:text-foreground disabled:opacity-40"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copied ? (isIndo ? "Tersalin!" : "Copied!") : (isIndo ? "Salin List Username" : "Copy Usernames")}</span>
                      </button>

                      <button
                        onClick={handleExportCsv}
                        disabled={totalItems === 0}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-background/50 px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-accent/40 hover:text-foreground disabled:opacity-40"
                      >
                        <Download className="h-3.5 w-3.5 text-accent" />
                        <span>CSV</span>
                      </button>

                      <button
                        onClick={handleExportJson}
                        disabled={totalItems === 0}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-background/50 px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-accent/40 hover:text-foreground disabled:opacity-40"
                      >
                        <Download className="h-3.5 w-3.5 text-accent" />
                        <span>JSON</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-background/60 text-text-secondary font-semibold border-b border-border">
                      <tr>
                        <th className="px-5 py-3 w-12">#</th>
                        <th className="px-5 py-3">{isIndo ? "Pengguna Instagram" : "Instagram Account"}</th>
                        <th className="px-5 py-3">{isIndo ? "Tanggal Follow" : "Date Followed"}</th>
                        <th className="px-5 py-3 text-right">{isIndo ? "Aksi" : "Action"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 font-medium">
                      {pageData.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-12 text-center text-text-secondary">
                            {searchQuery
                              ? (isIndo ? `Tidak ada akun dengan pencarian "${searchQuery}"` : `No accounts matching "${searchQuery}"`)
                              : (isIndo ? "Tidak ada akun dalam daftar ini." : "No accounts in this list.")}
                          </td>
                        </tr>
                      ) : (
                        pageData.map((item, idx) => {
                          const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            item.username
                          )}&background=6366f1&color=fff&bold=true&rounded=true`;

                          return (
                            <tr key={item.username} className="hover:bg-background/40 transition-colors">
                              <td className="px-5 py-3 text-text-secondary font-mono">{startIndex + idx + 1}</td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={avatarUrl}
                                    alt={item.username}
                                    className="h-8 w-8 rounded-full border border-border/80 object-cover"
                                  />
                                  <span className="font-semibold text-foreground">@{item.username}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-text-secondary">{formatDate(item.timestamp)}</td>
                              <td className="px-5 py-3 text-right">
                                <a
                                  href={`https://instagram.com/${item.username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 font-semibold text-accent transition-all hover:bg-accent hover:text-background"
                                >
                                  <span>{isIndo ? "Buka Profil" : "Profile"}</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                {pageSize !== -1 && totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border bg-surface p-4">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={safeCurrentPage === 1}
                      className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-text-secondary transition-all hover:border-accent hover:text-foreground disabled:opacity-40 disabled:hover:border-border"
                    >
                      {isIndo ? "Sebelumnya" : "Previous"}
                    </button>
                    <span className="text-xs text-text-secondary font-medium">
                      {isIndo ? `Halaman ${safeCurrentPage} dari ${totalPages}` : `Page ${safeCurrentPage} of ${totalPages}`}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={safeCurrentPage >= totalPages}
                      className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-text-secondary transition-all hover:border-accent hover:text-foreground disabled:opacity-40 disabled:hover:border-border"
                    >
                      {isIndo ? "Berikutnya" : "Next"}
                    </button>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </ToolPageLayout>
    </>
  );
}
