using pslib_market.Server.Data;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;

namespace pslib_market.Server.Services.ImageProcessing;

public class ImageProcessingWorker : BackgroundService
{
    private readonly ImageProcessingQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ImageProcessingWorker> _logger;

    public ImageProcessingWorker(
        ImageProcessingQueue queue,
        IServiceScopeFactory scopeFactory,
        ILogger<ImageProcessingWorker> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var job in _queue.DequeueAllAsync(stoppingToken))
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                var book = await dbContext.Books.FindAsync(new object[] { job.BookId }, stoppingToken);
                if (book == null) continue; 

                using var inputStream = new MemoryStream(job.RawImageData);

                using var outputStream = new MemoryStream();

                using (var image = await Image.LoadAsync(inputStream, stoppingToken))
                {
                    image.Mutate(x => x.Resize(new ResizeOptions
                    {
                        Mode = ResizeMode.Max,
                        Size = new Size(800, 800)
                    }));

                    await image.SaveAsJpegAsync(outputStream, new JpegEncoder { Quality = 75 }, stoppingToken);
                }

                book.ImageBlob = outputStream.ToArray();
                book.ImageContentType = "image/jpeg";
                book.LastUpdatedAt = DateTime.UtcNow;

                await dbContext.SaveChangesAsync(stoppingToken);
                _logger.LogInformation("Fotka pro inzerát {BookId} byla úspěšně zpracována na pozadí.", job.BookId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kritická chyba při zpracování obrázku na pozadí pro knihu {BookId}", job.BookId);
            }
        }
    }
}