"use client";

import { useState } from "react";

const TRACK_TYPES = [
	"SONG",
	"BEAT",
	"LOOP",
	"DRUMKIT",
] as const;

export default function CreatePageClient() {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [trackType, setTrackType] =
		useState<(typeof TRACK_TYPES)[number]>("SONG");
	const [isForSale, setIsForSale] = useState(false);
	const [priceInPoints, setPriceInPoints] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);
	const [uploadedUrl, setUploadedUrl] = useState("");

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const selected = e.target.files?.[0];
		if (!selected) return;

		const validTypes = ["audio/mpeg", "audio/wav", "audio/x-wav"];

		if (!validTypes.includes(selected.type)) {
			setError("Only MP3 or WAV files are allowed.");
			setFile(null);
			return;
		}

		setFile(selected);
		setError("");
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setSuccess("");
		setUploadedUrl("");

		if (!title.trim() || !file) {
			setError("Title and audio file are required.");
			return;
		}

		if (isForSale) {
			const numericPrice = Number(priceInPoints);

			if (
				!priceInPoints.trim() ||
				Number.isNaN(numericPrice) ||
				numericPrice <= 0
			) {
				setError("Please enter a valid point price.");
				return;
			}
		}

		setLoading(true);

		try {
			const formData = new FormData();
			formData.append("title", title);
			formData.append("description", description);
			formData.append("trackType", trackType);
			formData.append("isForSale", String(isForSale));
			formData.append("priceInPoints", isForSale ? priceInPoints : "");
			formData.append("file", file);

			const res = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Upload failed.");
				return;
			}

			setSuccess("Upload successful.");
			setUploadedUrl(data.data.fileUrl);
			setTitle("");
			setDescription("");
			setTrackType("SONG");
			setIsForSale(false);
			setPriceInPoints("");
			setFile(null);
		} catch (error) {
			console.error(error);
			setError("Upload failed. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-[#FAF8ED] px-4 text-[#4E3523]">
			<div className="mx-auto mt-10 max-w-2xl">
				<h1 className="text-2xl font-bold">Upload Audio</h1>
				<p className="mt-2 text-[#4E3523]/70">
					Upload your music, beat, loop, sample, or other audio file.
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
								onChange={(e) =>
									setTrackType(
										e.target.value as (typeof TRACK_TYPES)[number]
									)
								}
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
							<label className="mb-1 block text-sm font-medium">
								For Sale
							</label>
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

					{isForSale && (
						<div>
							<label className="mb-1 block text-sm font-medium">
								Price in Points
							</label>
							<input
								type="number"
								min="1"
								value={priceInPoints}
								onChange={(e) => setPriceInPoints(e.target.value)}
								placeholder="10"
								className="w-full rounded-xl border border-[#D6CFC7] bg-white px-4 py-3 text-sm outline-none focus:border-[#4E3523]"
							/>
							<p className="mt-1 text-xs text-[#4E3523]/60">
								Users will need this many points to buy this item.
							</p>
						</div>
					)}

					<div>
						<label className="mb-1 block text-sm font-medium">
							Audio File (.mp3 / .wav)
						</label>
						<input
							type="file"
							accept=".mp3,.wav"
							onChange={handleFileChange}
							className="w-full rounded-xl border border-[#D6CFC7] bg-white px-4 py-3 text-sm"
						/>

						{file && (
							<p className="mt-2 text-sm text-[#4E3523]/70">
								Selected: {file.name}
							</p>
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
						{loading ? "Uploading..." : "Upload"}
					</button>
				</form>

				{uploadedUrl && (
					<div className="mt-6 rounded-xl border border-[#D6CFC7] bg-white p-4">
						<p className="text-sm font-medium">Uploaded file:</p>
						<a
							href={uploadedUrl}
							target="_blank"
							rel="noreferrer"
							className="mt-2 inline-block text-sm text-blue-600 underline"
						>
							Open uploaded audio
						</a>
						<audio controls className="mt-4 w-full">
							<source src={uploadedUrl} />
							Your browser does not support audio playback.
						</audio>
					</div>
				)}
			</div>
		</div>
	);
}