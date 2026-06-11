"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/app/components/ConfirmModal";

// do not remove
// app/main/dashboard/create/CreatePageClient.tsx

const TRACK_TYPES = ["SONG", "BEAT", "LOOP", "DRUMKIT"] as const;

type TrackType = (typeof TRACK_TYPES)[number];

type EditableTrack = {
	id: string;
	title: string;
	description: string | null;
	trackType: TrackType;
	bpm: number | null;
	timeSignature: string | null;
	musicalKey: string | null;
	isForSale: boolean;
	regularPriceCents: number | null;
	fullPriceCents: number | null;
	previewMp3Url: string;
	regularWavKey: string | null;
	fullZipKey: string | null;
};

type CreatePageClientProps = {
	mode?: "create" | "edit";
	initialTrack?: EditableTrack;
};

function centsToUsdInput(priceCents?: number | null) {
	if (!priceCents) return "";
	return (priceCents / 100).toFixed(2);
}

export default function CreatePageClient({
	mode = "create",
	initialTrack,
}: CreatePageClientProps) {
	const isEditMode = mode === "edit";
	const router = useRouter();

	const [title, setTitle] = useState(initialTrack?.title ?? "");
	const [description, setDescription] = useState(
		initialTrack?.description ?? "",
	);
	const [trackType, setTrackType] = useState<TrackType>(
		initialTrack?.trackType ?? "SONG",
	);
	const [bpm, setBpm] = useState(
		initialTrack?.bpm ? String(initialTrack.bpm) : "",
	);
	const [timeSignature, setTimeSignature] = useState(
		initialTrack?.timeSignature ?? "4/4",
	);
	const [musicalKey, setMusicalKey] = useState(initialTrack?.musicalKey ?? "");
	const [isForSale, setIsForSale] = useState(initialTrack?.isForSale ?? false);
	const [regularPriceUsd, setRegularPriceUsd] = useState(
		centsToUsdInput(initialTrack?.regularPriceCents),
	);
	const [fullPriceUsd, setFullPriceUsd] = useState(
		centsToUsdInput(initialTrack?.fullPriceCents),
	);
	const [previewMp3File, setPreviewMp3File] = useState<File | null>(null);
	const [regularWavFile, setRegularWavFile] = useState<File | null>(null);
	const [fullZipFile, setFullZipFile] = useState<File | null>(null);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [uploadedUrl, setUploadedUrl] = useState(
		initialTrack?.previewMp3Url ?? "",
	);

	function handlePreviewMp3Change(e: React.ChangeEvent<HTMLInputElement>) {
		const selected = e.target.files?.[0];
		if (!selected) return;

		if (
			selected.type !== "audio/mpeg" &&
			!selected.name.toLowerCase().endsWith(".mp3")
		) {
			setError("Preview file must be an MP3.");
			setPreviewMp3File(null);
			return;
		}

		setPreviewMp3File(selected);
		setError("");
	}

	function handleRegularWavChange(e: React.ChangeEvent<HTMLInputElement>) {
		const selected = e.target.files?.[0];
		if (!selected) return;

		const isWav =
			["audio/wav", "audio/x-wav", "audio/wave"].includes(selected.type) ||
			selected.name.toLowerCase().endsWith(".wav");

		if (!isWav) {
			setError("Regular version must be a WAV file.");
			setRegularWavFile(null);
			return;
		}

		setRegularWavFile(selected);
		setError("");
	}

	function handleFullZipChange(e: React.ChangeEvent<HTMLInputElement>) {
		const selected = e.target.files?.[0];
		if (!selected) return;

		const isZip =
			selected.type === "application/zip" ||
			selected.type === "application/x-zip-compressed" ||
			selected.name.toLowerCase().endsWith(".zip");

		if (!isZip) {
			setError("Full version must be a ZIP file.");
			setFullZipFile(null);
			return;
		}

		setFullZipFile(selected);
		setError("");
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setSuccess("");

		if (!title.trim()) {
			setError("Title is required.");
			return;
		}

		if (!isEditMode && !previewMp3File) {
			setError("Preview MP3 is required.");
			return;
		}

		if (bpm.trim()) {
			const numericBpm = Number(bpm);

			if (Number.isNaN(numericBpm) || numericBpm <= 0) {
				setError("Please enter a valid BPM.");
				return;
			}
		}

		if (isForSale) {
			const regularPrice = Number(regularPriceUsd);
			const fullPrice = Number(fullPriceUsd);
			const hasExistingRegularWav = Boolean(initialTrack?.regularWavKey);

			if (!isEditMode && !regularWavFile) {
				setError("Please upload a WAV file for the regular version.");
				return;
			}

			if (isEditMode && !hasExistingRegularWav && !regularWavFile) {
				setError("Please upload a WAV file for the regular version.");
				return;
			}

			if (
				!regularPriceUsd.trim() ||
				Number.isNaN(regularPrice) ||
				regularPrice <= 0
			) {
				setError("Please enter a valid regular price in USD.");
				return;
			}

			if (
				fullZipFile &&
				(!fullPriceUsd.trim() || Number.isNaN(fullPrice) || fullPrice <= 0)
			) {
				setError("Please enter a valid full version price in USD.");
				return;
			}

			if (
				isEditMode &&
				initialTrack?.fullZipKey &&
				fullPriceUsd.trim() &&
				(Number.isNaN(fullPrice) || fullPrice <= 0)
			) {
				setError("Please enter a valid full version price in USD.");
				return;
			}
		}

		setLoading(true);

		try {
			const formData = new FormData();
			formData.append("title", title);
			formData.append("description", description);
			formData.append("trackType", trackType);
			formData.append("bpm", bpm);
			formData.append("timeSignature", timeSignature);
			formData.append("musicalKey", musicalKey);
			formData.append("isForSale", String(isForSale));
			formData.append("regularPriceUsd", isForSale ? regularPriceUsd : "");
			formData.append("fullPriceUsd", isForSale ? fullPriceUsd : "");

			if (previewMp3File) {
				formData.append("previewMp3File", previewMp3File);
			}

			if (isForSale && regularWavFile) {
				formData.append("regularWavFile", regularWavFile);
			}

			if (isForSale && fullZipFile) {
				formData.append("fullZipFile", fullZipFile);
			}

			const res = await fetch(
				isEditMode && initialTrack
					? `/api/tracks/${initialTrack.id}/edit`
					: "/api/upload",
				{
					method: isEditMode ? "PATCH" : "POST",
					body: formData,
				},
			);

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || `${isEditMode ? "Update" : "Upload"} failed.`);
				return;
			}

			setSuccess(
				isEditMode ? "Track updated successfully." : "Upload successful.",
			);
			setUploadedUrl(
				data.data?.previewMp3Url || data.data?.fileUrl || uploadedUrl,
			);
			setPreviewMp3File(null);
			setRegularWavFile(null);
			setFullZipFile(null);

			if (!isEditMode) {
				setTitle("");
				setDescription("");
				setTrackType("SONG");
				setBpm("");
				setTimeSignature("4/4");
				setMusicalKey("");
				setIsForSale(false);
				setRegularPriceUsd("");
				setFullPriceUsd("");
			}
		} catch (error) {
			console.error(error);
			setError(`${isEditMode ? "Update" : "Upload"} failed. Please try again.`);
		} finally {
			setLoading(false);
		}
	}

	async function handleDeleteTrack() {
		if (!isEditMode || !initialTrack) return;

		setDeleteLoading(true);
		setError("");
		setSuccess("");

		try {
			const response = await fetch(`/api/tracks/${initialTrack.id}/delete`, {
				method: "DELETE",
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "Failed to delete track.");
				return;
			}

			setIsDeleteModalOpen(false);
			router.push("/main");
			router.refresh();
		} catch (error) {
			console.error("Delete track error:", error);
			setError("Failed to delete track. Please try again.");
		} finally {
			setDeleteLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-[#FAF8ED] px-4 text-[#4E3523]">
			<div className="mx-auto mt-10 max-w-2xl">
				<h1 className="text-2xl font-bold">
					{isEditMode ? "Edit Track" : "Upload Audio"}
				</h1>
				<p className="mt-2 text-[#4E3523]/70">
					{isEditMode
						? "Update your track details, pricing, and replace files when needed. Leave file inputs empty to keep the current files."
						: "Upload a fast MP3 preview for customers to stream. Add a protected WAV for the regular version and an optional ZIP for the full version."}
				</p>

				<form
					onSubmit={handleSubmit}
					className="mt-6 space-y-5 rounded-2xl border border-[#D6CFC7] bg-white p-6 shadow-sm"
				>
					<div>
						<label className="mb-1 block text-sm font-medium">Title</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Late Night Beat"
							className="w-full rounded-xl border border-[#D6CFC7] bg-white px-4 py-3 text-sm outline-none focus:border-[#4E3523]"
						/>
					</div>

					<div>
						<label className="mb-1 block text-sm font-medium">
							Description
						</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Describe your upload..."
							rows={4}
							className="w-full rounded-xl border border-[#D6CFC7] bg-white px-4 py-3 text-sm outline-none focus:border-[#4E3523]"
						/>
					</div>

					<div className="grid gap-5 md:grid-cols-2">
						<div>
							<label className="mb-1 block text-sm font-medium">
								Track Type
							</label>
							<select
								value={trackType}
								onChange={(e) => setTrackType(e.target.value as TrackType)}
								className="w-full rounded-xl border border-[#D6CFC7] bg-white px-4 py-3 text-sm outline-none focus:border-[#4E3523]"
							>
								{TRACK_TYPES.map((type) => (
									<option key={type} value={type}>
										{type.charAt(0) + type.slice(1).toLowerCase()}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="mb-1 block text-sm font-medium">For Sale</label>
							<div className="flex h-[50px] items-center rounded-xl border border-[#D6CFC7] px-4">
								<label className="flex items-center gap-3 text-sm">
									<input
										type="checkbox"
										checked={isForSale}
										onChange={(e) => setIsForSale(e.target.checked)}
										className="h-4 w-4"
									/>
									This item is for sale
								</label>
							</div>
						</div>
					</div>

					<div className="grid gap-5 md:grid-cols-3">
						<div>
							<label className="mb-1 block text-sm font-medium">BPM</label>
							<input
								type="number"
								min="1"
								value={bpm}
								onChange={(e) => setBpm(e.target.value)}
								placeholder="140"
								className="w-full rounded-xl border border-[#D6CFC7] bg-white px-4 py-3 text-sm outline-none focus:border-[#4E3523]"
							/>
						</div>

						<div>
							<label className="mb-1 block text-sm font-medium">
								Time Signature
							</label>
							<select
								value={timeSignature}
								onChange={(e) => setTimeSignature(e.target.value)}
								className="w-full rounded-xl border border-[#D6CFC7] bg-white px-4 py-3 text-sm outline-none focus:border-[#4E3523]"
							>
								<option value="4/4">4/4</option>
								<option value="3/4">3/4</option>
								<option value="6/8">6/8</option>
								<option value="2/4">2/4</option>
								<option value="5/4">5/4</option>
								<option value="7/8">7/8</option>
							</select>
						</div>

						<div>
							<label className="mb-1 block text-sm font-medium">Key</label>
							<select
								value={musicalKey}
								onChange={(e) => setMusicalKey(e.target.value)}
								className="w-full rounded-xl border border-[#D6CFC7] bg-white px-4 py-3 text-sm outline-none focus:border-[#4E3523]"
							>
								<option value="">Select key</option>
								<option value="C Major">C Major</option>
								<option value="C Minor">C Minor</option>
								<option value="C# Major">C# Major</option>
								<option value="C# Minor">C# Minor</option>
								<option value="D Major">D Major</option>
								<option value="D Minor">D Minor</option>
								<option value="D# Minor">D# Minor</option>
								<option value="Eb Major">Eb Major</option>
								<option value="E Major">E Major</option>
								<option value="E Minor">E Minor</option>
								<option value="F Major">F Major</option>
								<option value="F Minor">F Minor</option>
								<option value="F# Major">F# Major</option>
								<option value="F# Minor">F# Minor</option>
								<option value="G Major">G Major</option>
								<option value="G Minor">G Minor</option>
								<option value="G# Minor">G# Minor</option>
								<option value="Ab Major">Ab Major</option>
								<option value="A Major">A Major</option>
								<option value="A Minor">A Minor</option>
								<option value="A# Minor">A# Minor</option>
								<option value="Bb Major">Bb Major</option>
								<option value="B Major">B Major</option>
								<option value="B Minor">B Minor</option>
							</select>
						</div>
					</div>

					{isForSale && (
						<div>
							<label className="mb-1 block text-sm font-medium">
								Regular Price (USD)
							</label>
							<input
								type="number"
								min="1"
								step="0.01"
								value={regularPriceUsd}
								onChange={(e) => setRegularPriceUsd(e.target.value)}
								placeholder="29.99"
								className="w-full rounded-xl border border-[#D6CFC7] bg-white px-4 py-3 text-sm outline-none focus:border-[#4E3523]"
							/>
							<p className="mt-1 text-xs text-[#4E3523]/60">
								Customers who buy the regular version will get access to the WAV
								file.
							</p>

							<div className="mt-4">
								<label className="mb-1 block text-sm font-medium">
									Full Version Price (USD)
								</label>
								<input
									type="number"
									min="1"
									step="0.01"
									value={fullPriceUsd}
									onChange={(e) => setFullPriceUsd(e.target.value)}
									placeholder="79.99"
									className="w-full rounded-xl border border-[#D6CFC7] bg-white px-4 py-3 text-sm outline-none focus:border-[#4E3523]"
								/>
								<p className="mt-1 text-xs text-[#4E3523]/60">
									Optional. Customers who buy the full version will get access
									to the ZIP file.
								</p>
							</div>
						</div>
					)}

					<div className="space-y-4">
						<div>
							<label className="mb-1 block text-sm font-medium">
								Preview MP3 (.mp3)
							</label>
							<input
								type="file"
								accept=".mp3,audio/mpeg"
								onChange={handlePreviewMp3Change}
								className="w-full rounded-xl border border-[#D6CFC7] bg-white px-4 py-3 text-sm"
							/>
							<p className="mt-1 text-xs text-[#4E3523]/60">
								{isEditMode
									? "Leave empty to keep the current MP3 preview."
									: "Public streaming preview. This should be optimized for fast playback."}
							</p>

							{previewMp3File && (
								<p className="mt-2 text-sm text-[#4E3523]/70">
									Selected: {previewMp3File.name}
								</p>
							)}
						</div>

						{isForSale && (
							<>
								<div>
									<label className="mb-1 block text-sm font-medium">
										Regular Version WAV (.wav)
									</label>
									<input
										type="file"
										accept=".wav,audio/wav,audio/x-wav"
										onChange={handleRegularWavChange}
										className="w-full rounded-xl border border-[#D6CFC7] bg-white px-4 py-3 text-sm"
									/>
									<p className="mt-1 text-xs text-[#4E3523]/60">
										{isEditMode
											? "Leave empty to keep the current regular WAV."
											: "Protected download after regular purchase."}
									</p>

									{regularWavFile && (
										<p className="mt-2 text-sm text-[#4E3523]/70">
											Selected: {regularWavFile.name}
										</p>
									)}
								</div>

								<div>
									<label className="mb-1 block text-sm font-medium">
										Full Version ZIP (.zip)
									</label>
									<input
										type="file"
										accept=".zip,application/zip"
										onChange={handleFullZipChange}
										className="w-full rounded-xl border border-[#D6CFC7] bg-white px-4 py-3 text-sm"
									/>
									<p className="mt-1 text-xs text-[#4E3523]/60">
										{isEditMode
											? "Leave empty to keep the current full ZIP."
											: "Optional protected download after full purchase. Use this for stems, license files, or project files."}
									</p>

									{fullZipFile && (
										<p className="mt-2 text-sm text-[#4E3523]/70">
											Selected: {fullZipFile.name}
										</p>
									)}
								</div>
							</>
						)}
					</div>

					{error && (
						<div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
							{error}
						</div>
					)}

					{success && (
						<div className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
							{success}
						</div>
					)}

					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-xl bg-[#4E3523] px-4 py-3 text-sm font-medium text-[#FAF8ED] hover:opacity-90 disabled:opacity-60"
					>
						{loading
							? isEditMode
								? "Updating..."
								: "Uploading..."
							: isEditMode
								? "Save Changes"
								: "Upload"}
					</button>

					{isEditMode && (
						<div className="rounded-2xl border border-red-200 bg-red-50 p-4">
							<h2 className="text-sm font-semibold text-red-700">
								Delete Track
							</h2>
							<p className="mt-1 text-xs leading-5 text-red-700/80">
								If nobody has purchased this track, it will be permanently
								deleted. If buyers already purchased it, it will be removed from
								the marketplace but buyers can still access their downloads.
							</p>
							<button
								type="button"
								onClick={() => setIsDeleteModalOpen(true)}
								disabled={deleteLoading || loading}
								className="mt-4 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
							>
								{deleteLoading ? "Deleting..." : "Delete Track"}
							</button>
						</div>
					)}
				</form>

				{uploadedUrl && (
					<div className="mt-6 rounded-xl border border-[#D6CFC7] bg-white p-4">
						<p className="text-sm font-medium">
							{isEditMode ? "Current preview:" : "Uploaded preview:"}
						</p>
						<a
							href={uploadedUrl}
							target="_blank"
							rel="noreferrer"
							className="mt-2 inline-block text-sm text-blue-600 underline"
						>
							Open preview audio
						</a>
						<audio controls className="mt-4 w-full">
							<source src={uploadedUrl} />
							Your browser does not support audio playback.
						</audio>
					</div>
				)}

				<ConfirmModal
					isOpen={isDeleteModalOpen}
					title="Delete this track?"
					description={
						"If this track has no purchases, it will be permanently deleted.\n\nIf buyers already purchased it, it will be removed from the marketplace but buyers can still access their downloads."
					}
					confirmText="Delete Track"
					cancelText="Keep Track"
					variant="danger"
					loading={deleteLoading}
					onCancel={() => setIsDeleteModalOpen(false)}
					onConfirm={handleDeleteTrack}
				/>
			</div>
		</div>
	);
}
