import * as FileSystem from "expo-file-system";
import uuid from "react-native-uuid";

/**
 * Copy a file into the application's document directory to make sure
 * it stays available even if the original source (e.g. Camera Roll) is deleted.
 *
 * Returns the new local URI. If copying fails for whatever reason, the original
 * `sourceUri` is returned so the calling code can still function.
 *
 * @param sourceUri   Original file URI provided by the picker / camera
 * @param subDir      Optional folder name that will be created in the document directory. Defaults to `"chat"`.
 */
export const copyFileToDocumentDir = async (
  sourceUri: string,
  subDir: string = "chat"
): Promise<string> => {
  try {
    // Ensure destination directory exists
    const targetDir = `${FileSystem.documentDirectory}${subDir}/`;
    const dirInfo = await FileSystem.getInfoAsync(targetDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
    }

    // If the uri already resides inside our targetDir, no need to copy
    if (sourceUri.startsWith(targetDir)) {
      return sourceUri;
    }

    // Derive file extension (fallback to .dat when unknown)
    const extensionMatch = sourceUri.match(/\.[a-zA-Z0-9]+$/);
    const extension = extensionMatch ? extensionMatch[0] : ".dat";

    const destUri = `${targetDir}${uuid.v4()}${extension}`;
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });

    return destUri;
  } catch (err) {
    console.warn("copyFileToDocumentDir failed", err);
    return sourceUri; // fallback to original URI so functionality doesn't break
  }
};

/**
 * Remove all files that have been cached inside `documentDirectory/<subDir>`.
 * If the directory does not exist, the promise resolves silently.
 */
export const clearCachedFiles = async (subDir: string = "chat_images") => {
  try {
    const targetDir = `${FileSystem.documentDirectory}${subDir}/`;
    const dirInfo = await FileSystem.getInfoAsync(targetDir);
    if (!dirInfo.exists) return;

    const files = await FileSystem.readDirectoryAsync(targetDir);
    await Promise.all(
      files.map(async (fileName) => {
        try {
          await FileSystem.deleteAsync(`${targetDir}${fileName}`, {
            idempotent: true,
          });
        } catch (e) {
          console.warn("Failed to delete cached file", fileName, e);
        }
      })
    );
  } catch (err) {
    console.warn("clearCachedFiles error", err);
  }
};
