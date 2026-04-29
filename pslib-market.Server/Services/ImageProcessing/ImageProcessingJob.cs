namespace pslib_market.Server.Services.ImageProcessing;

public record ImageProcessingJob(int BookId, byte[] RawImageData, string ContentType);