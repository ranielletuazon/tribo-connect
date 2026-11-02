import type { Language } from "@/hooks/use-language";
import { db, storage } from "@/lib/firebase";
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    writeBatch,
    type DocumentSnapshot,
    type Timestamp,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";

// a batch can hold at most 500 writes
const DELETE_BATCH_SIZE = 500;

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

export function formatTimeAgo(
    timestamp: Timestamp | null,
    lang: Language = "tl",
): string {
    const en = lang === "en";
    const justNow = en ? "Just now" : "Ngayon lang";
    if (!timestamp) return justNow;
    const diffMins = Math.floor(
        (Date.now() - timestamp.toDate().getTime()) / 60000,
    );
    if (diffMins < 1) return justNow;
    if (diffMins < 60) {
        return en
            ? `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`
            : `${diffMins} minuto ang nakalipas`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
        return en
            ? `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`
            : `${diffHours} oras ang nakalipas`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return en ? "Yesterday" : "Kahapon";
    return en ? `${diffDays} days ago` : `${diffDays} araw ang nakalipas`;
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

// the author can delete their own post, admins can delete anyone's
export function canDeletePost(
    post: Post,
    uid: string | undefined,
    role: string | undefined,
): boolean {
    return !!uid && (post.authorId === uid || role === "admin");
}

// removes the post first so it disappears right away, then cleans up
// its comments and image. if the cleanup fails the post is already gone,
// so leftovers are fine
export async function deletePost(post: Post): Promise<void> {
    const postRef = doc(db, "posts", post.id);
    await deleteDoc(postRef);

    try {
        const commentsSnap = await getDocs(collection(postRef, "comments"));
        for (let i = 0; i < commentsSnap.docs.length; i += DELETE_BATCH_SIZE) {
            const batch = writeBatch(db);
            commentsSnap.docs
                .slice(i, i + DELETE_BATCH_SIZE)
                .forEach((commentDoc) => batch.delete(commentDoc.ref));
            await batch.commit();
        }
    } catch (err) {
        console.error("Delete post comments error:", err);
    }

    if (post.imageUrl) {
        deleteObject(ref(storage, `posts/${post.id}.jpg`)).catch((err) =>
            console.error("Delete post image error:", err),
        );
    }
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
