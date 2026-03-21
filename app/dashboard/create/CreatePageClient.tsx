"use client";

import { useState } from "react";

export default function CreatePageClient() {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
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

		if (!title || !file) {
			setError("Title and audio file are required.");
			return;
		}

		setLoading(true);

		try {
			const formData = new FormData();
			formData.append("title", title);
			formData.append("description", description);
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
			setFile(null);
		} catch (error) {
			console.error(error);
			setError("Upload failed. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-[#FAF8ED] text-[#4E3523]">
			<div className="mx-auto max-w-xl mt-10">
				<h1 className="text-2xl font-bold">Upload Beat</h1>
				<p className="mt-2 text-[#4E3523]/70">Upload your MP3 or WAV file.</p>

				<form onSubmit={handleSubmit} className="mt-6 space-y-5">
					<div>
						<label className="mb-1 block text-sm font-medium">Title</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="My Beat"
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
							placeholder="Describe your beat..."
							rows={4}
							className="w-full rounded-xl border border-[#D6CFC7] bg-white px-4 py-3 text-sm outline-none focus:border-[#4E3523]"
						/>
					</div>

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
