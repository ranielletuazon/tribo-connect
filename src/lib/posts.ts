import type { DocumentSnapshot, Timestamp } from "firebase/firestore";

export interface Post {
    id: string;
    authorId: string;
    authorName: string;
    authorBarangay: string;
    authorPhotoURL: string | null;
    // saved when the post is made, so older posts don't have it
    authorVerified: boolean;
    content: string;
    imageUrl: string | null;
    likes: string[];
    commentCount: number;
    createdAt: Timestamp | null;
}

export interface PostComment {
    id: string;
    authorId: string;
    authorName: string;
    authorPhotoURL: string | null;
    authorVerified: boolean;
    content: string;
    createdAt: Timestamp | null;
}

export function formatTimeAgo(timestamp: Timestamp | null): string {
    if (!timestamp) return "Ngayon lang";
    const diffMins = Math.floor(
        (Date.now() - timestamp.toDate().getTime()) / 60000,
    );
    if (diffMins < 1) return "Ngayon lang";
    if (diffMins < 60) return `${diffMins} minuto ang nakalipas`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} oras ang nakalipas`;
    const diffDays = Math.floor(diffHours / 24);
    return diffDays === 1 ? "Kahapon" : `${diffDays} araw ang nakalipas`;
}

export function mapDocToPost(docSnap: DocumentSnapshot): Post {
    const data = docSnap.data() ?? {};
    return {
        id: docSnap.id,
        authorId: data.authorId,
        authorName: data.authorName ?? "Gumagamit",
        authorBarangay: data.authorBarangay,
        authorPhotoURL: data.authorPhotoURL ?? null,
        authorVerified: data.authorVerified === true,
        content: data.content ?? "",
        imageUrl: data.imageUrl ?? null,
        likes: data.likes ?? [],
        commentCount: data.commentCount ?? 0,
        createdAt: data.createdAt ?? null,
    };
}

export function mapDocToComment(docSnap: DocumentSnapshot): PostComment {
    // "estimate" so a comment we just sent has a time before the server confirms it
    const data = docSnap.data({ serverTimestamps: "estimate" }) ?? {};
    return {
        id: docSnap.id,
        authorId: data.authorId,
        authorName: data.authorName ?? "Gumagamit",
        authorPhotoURL: data.authorPhotoURL ?? null,
        authorVerified: data.authorVerified === true,
        content: data.content ?? "",
        createdAt: data.createdAt ?? null,
    };
}
