"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CommentFormProps = {
	trackId: string;
};

export default function CommentForm({ trackId }: CommentFormProps) {
	const router = useRouter();

	const [content, setContent] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");

		if (!content.trim()) {
			setError("Comment cannot be empty.");
			return;
		}

		setLoading(true);

		try {
			const res = await fetch(`/api/tracks/${trackId}/comment`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ content }),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "An error occurred while posting the comment.");
			} else {
				setContent("");
				router.refresh();
			}
		} catch (err) {
			setError("An error occurred while posting the comment.");
		} finally {
			setLoading(false);
		}
	}
	return (
		<form onSubmit={handleSubmit} className="mt-6">
			<textarea
				value={content}
				onChange={(e) => setContent(e.target.value)}
				placeholder="Write a comment..."
				className="w-full rounded-2xl border border-[#D6CFC7] bg-[#FAF8ED] px-4 py-3 text-sm outline-none focus:border-[#4E3523]"
				rows={4}
				maxLength={500}
			/>

			<div className="mt-2 flex items-center justify-between">
				<p className="text-xs text-[#4E3523]/60">{content.length}/500</p>

				<button
					type="submit"
					disabled={loading}
					className="rounded-full bg-[#4E3523] px-5 py-2 text-sm font-medium text-[#FAF8ED] hover:opacity-90 disabled:opacity-60"
				>
					{loading ? "Posting..." : "Post Comment"}
				</button>
			</div>

			{error && (
				<div className="mt-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
					{error}
				</div>
			)}
		</form>
	);
}
