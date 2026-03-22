import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

type ChannelPageProps = {
	params: Promise<{
		handle: string;
	}>;
};

export default async function ChannelPage({ params }: ChannelPageProps) {
	const { handle } = await params;
	const currentUser = await getCurrentUser();

	const channelUser = await prisma.user.findUnique({
		where: {
			handle: handle.toLowerCase(),
		},
		include: {
			tracks: {
				orderBy: {
					createdAt: "desc",
				},
			},
		},
	});

	if (!channelUser) {
		notFound();
	}

	const isOwnChannel = currentUser?.id === channelUser.id;

	return (
		<div className="min-h-screen bg-[#FAF8ED] text-[#4E3523]">

			<div className="px-6 py-10">
				<div className="mx-auto max-w-6xl">
					<div className="rounded-3xl border border-[#D6CFC7] bg-white p-6 shadow-sm">
						<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
							<div className="flex items-center gap-4">
								<div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EAD9C7] text-2xl font-bold text-[#4E3523]">
									{channelUser.name?.charAt(0).toUpperCase() ||
										channelUser.email.charAt(0).toUpperCase()}
								</div>

								<div>
									<h1 className="text-3xl font-bold">
										{channelUser.name || "Unnamed Artist"}
									</h1>
									<p className="mt-1 text-sm text-[#4E3523]/70">
										@{channelUser.handle}
									</p>
									<p className="mt-1 text-sm text-[#4E3523]/70">
										{channelUser.email}
									</p>
									<p className="mt-2 text-sm text-[#4E3523]/70">
										{channelUser.tracks.length} track
										{channelUser.tracks.length !== 1 ? "s" : ""}
									</p>
								</div>
							</div>

							{isOwnChannel && (
								<div className="rounded-full bg-[#4E3523] px-4 py-2 text-sm font-medium text-[#FAF8ED]">
									Your Channel
								</div>
							)}
						</div>
					</div>

					<div className="mt-8">
						<h2 className="text-2xl font-semibold">Uploaded Music</h2>

						{channelUser.tracks.length === 0 ? (
							<div className="mt-6 rounded-2xl border border-[#D6CFC7] bg-white p-6 text-center">
								<p className="text-lg font-medium">No tracks uploaded yet</p>
								<p className="mt-2 text-sm text-[#4E3523]/70">
									This artist has not uploaded any music yet.
								</p>
							</div>
						) : (
							<div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
								{channelUser.tracks.map((track) => (
									<div
										key={track.id}
										className="rounded-2xl border border-[#D6CFC7] bg-white p-5 shadow-sm"
									>
										<div className="mb-4">
											<div className="flex h-40 items-center justify-center rounded-2xl bg-[#EAD9C7] text-[#4E3523]">
												<span className="text-sm font-medium">
													Cover Placeholder
												</span>
											</div>
										</div>

										<h3 className="text-lg font-semibold">{track.title}</h3>
										<p className="mt-1 line-clamp-2 text-sm text-[#4E3523]/70">
											{track.description || "No description"}
										</p>

										<div className="mt-3">
											<span className="inline-block rounded-full bg-[#FAF8ED] px-3 py-1 text-xs font-medium text-[#4E3523]">
												{track.fileType === "audio/mpeg"
													? "MP3"
													: track.fileType.includes("wav")
														? "WAV"
														: track.fileType}
											</span>
										</div>

										<audio controls className="mt-4 w-full">
											<source src={track.fileUrl} />
											Your browser does not support audio playback.
										</audio>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
