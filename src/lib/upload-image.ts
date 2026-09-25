import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { storage } from "@/lib/firebase";

// read a local file (file:// uri from the image picker) into a Blob.
// fetch().blob() and uploadString() both break on React Native, so we use
// XMLHttpRequest like the Expo firebase storage example does
function uriToBlob(uri: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response as Blob);
        xhr.onerror = () => reject(new Error("Could not read image file"));
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
    });
}

// uploads the image at uri to storage at path and returns its download url
export async function uploadImage(uri: string, path: string): Promise<string> {
    const blob = await uriToBlob(uri);
    try {
        if (blob.size === 0) throw new Error("Image file is empty");
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, blob, {
            contentType: blob.type || "image/jpeg",
        });
        return await getDownloadURL(storageRef);
    } finally {
        // free the native copy of the file
        (blob as Blob & { close?: () => void }).close?.();
    }
}
