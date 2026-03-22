import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";

type SongPageProps = {
	params: Promise<{
		trackId: string;
	}>;
};

export default async function SongPage({ params }: SongPageProps) {
	const { trackId } = await params;
	const user = await getCurrentUser();

	const track = await prisma.track.findUnique({
		where: {
			id: trackId,
		},
		include: {
			owner: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			comments: {
				orderBy: {
					createdAt: "desc",
				},
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			},
		},
	});

	if (!track) {
		notFound();
	}

	return (
		<div className="min-h-screen bg-[#FAF8ED] text-[#4E3523]">
			<div className="px-6 py-10">
				<div className="mx-auto max-w-5xl">
					<div className="grid gap-8 md:grid-cols-[260px_1fr]">
						<div className="rounded-3xl border border-[#D6CFC7] bg-white p-5 shadow-sm">
							<div className="flex h-56 items-center justify-center rounded-2xl bg-[#EAD9C7] text-[#4E3523]">
								<span className="text-sm font-medium">Cover Placeholder</span>
							</div>
						</div>

						<div className="rounded-3xl border border-[#D6CFC7] bg-white p-6 shadow-sm">
							<p className="text-sm text-[#4E3523]/70">
								{track.owner ? (
									<Link
										href={`/channel/${track.owner.id}`}
										className="hover:underline"
									>
										{track.owner.name || track.owner.email}
									</Link>
								) : (
									"Unknown Artist"
								)}
							</p>

							<h1 className="mt-2 text-4xl font-bold">{track.title}</h1>

							<div className="mt-4">
								<span className="inline-block rounded-full bg-[#FAF8ED] px-3 py-1 text-xs font-medium text-[#4E3523]">
									{track.fileType === "audio/mpeg"
										? "MP3"
										: track.fileType.includes("wav")
											? "WAV"
											: track.fileType}
								</span>
							</div>

							<div className="mt-6">
								<audio controls className="w-full">
									<source src={track.fileUrl} />
									Your browser does not support audio playback.
								</audio>
							</div>

							<div className="mt-8">
								<h2 className="text-xl font-semibold">Description</h2>
								<p className="mt-3 whitespace-pre-line text-[#4E3523]/80">
									{track.description ||
										"No description provided for this song yet."}
								</p>
							</div>
						</div>
					</div>

					<div className="mt-8 rounded-3xl border border-[#D6CFC7] bg-white p-6 shadow-sm">
						<div className="flex items-center justify-between">
							<h2 className="text-2xl font-semibold">Comments</h2>
							<span className="text-sm text-[#4E3523]/70">
								{track.comments.length} comment
								{track.comments.length !== 1 ? "s" : ""}
							</span>
						</div>

						{!user && (
							<div className="mt-4 rounded-2xl border border-[#D6CFC7] bg-[#FAF8ED] p-4 text-sm text-[#4E3523]/80">
								<Link href="/auth/login" className="font-medium underline">
									Log in
								</Link>{" "}
								to leave a comment.
							</div>
						)}

						{user && (
							<form className="mt-6">
								<textarea
									placeholder="Write a comment..."
									className="w-full rounded-2xl border border-[#D6CFC7] bg-[#FAF8ED] px-4 py-3 text-sm outline-none focus:border-[#4E3523]"
									rows={4}
									disabled
								/>
								<button
									type="button"
									className="mt-3 rounded-full bg-[#4E3523] px-5 py-2 text-sm font-medium text-[#FAF8ED] opacity-60"
								>
									Post Comment
								</button>
								<p className="mt-2 text-xs text-[#4E3523]/60">
									Comment posting UI is here. Next we can wire the API.
								</p>
							</form>
						)}

						<div className="mt-8 space-y-4">
							{track.comments.length === 0 ? (
								<div className="rounded-2xl border border-[#D6CFC7] bg-[#FAF8ED] p-5 text-center">
									<p className="font-medium">No comments yet</p>
									<p className="mt-2 text-sm text-[#4E3523]/70">
										Start the conversation on this song.
									</p>
								</div>
							) : (
								track.comments.map((comment?: any) => (
									<div
										key={comment.id}
										className="rounded-2xl border border-[#D6CFC7] bg-[#FAF8ED] p-4"
									>
										<div className="flex items-center justify-between gap-4">
											<div>
												<p className="font-medium">
													{comment.user.name || comment.user.email}
												</p>
												<p className="text-xs text-[#4E3523]/60">
													{new Date(comment.createdAt).toLocaleString()}
												</p>
											</div>
										</div>

										<p className="mt-3 text-sm text-[#4E3523]/85">
											{comment.content}
										</p>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
