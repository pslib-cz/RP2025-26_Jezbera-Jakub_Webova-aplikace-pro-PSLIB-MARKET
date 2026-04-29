namespace pslib_market.Server.Helpers
{
    public static class BookHelpers
    {
        public static string ResolveUserName(
            string? userName,
            string? userEmail,
            string fallback = "Neznámý uživatel")
        {
            var resolvedName = userName;
            if (string.IsNullOrWhiteSpace(resolvedName) && !string.IsNullOrWhiteSpace(userEmail))
            {
                resolvedName = userEmail.Split('@')[0];
            }
            if (string.IsNullOrWhiteSpace(resolvedName))
            {
                return fallback;
            }
            return resolvedName;
        }

        public static bool IsSupportedPhotoUpload(string? contentType, string? fileName)
        {
            var ct = contentType?.Trim();
            if (string.Equals(ct, "image/jpeg", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(ct, "image/png", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(ct, "image/webp", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(ct, "image/gif", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(ct, "image/bmp", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(ct, "image/tiff", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
            var ext = Path.GetExtension(fileName ?? "");
            return string.Equals(ext, ".jpg", StringComparison.OrdinalIgnoreCase)
                || string.Equals(ext, ".jpeg", StringComparison.OrdinalIgnoreCase)
                || string.Equals(ext, ".png", StringComparison.OrdinalIgnoreCase)
                || string.Equals(ext, ".webp", StringComparison.OrdinalIgnoreCase)
                || string.Equals(ext, ".gif", StringComparison.OrdinalIgnoreCase)
                || string.Equals(ext, ".bmp", StringComparison.OrdinalIgnoreCase)
                || string.Equals(ext, ".tif", StringComparison.OrdinalIgnoreCase)
                || string.Equals(ext, ".tiff", StringComparison.OrdinalIgnoreCase);
        }
    }
}