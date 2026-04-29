using System.Threading.Channels;

namespace pslib_market.Server.Services.ImageProcessing;

public class ImageProcessingQueue
{
    private readonly Channel<ImageProcessingJob> _queue = Channel.CreateBounded<ImageProcessingJob>(
        new BoundedChannelOptions(100)
        {
            FullMode = BoundedChannelFullMode.Wait
        });

    public async ValueTask EnqueueAsync(ImageProcessingJob job, CancellationToken cancellationToken = default)
    {
        await _queue.Writer.WriteAsync(job, cancellationToken);
    }

    public IAsyncEnumerable<ImageProcessingJob> DequeueAllAsync(CancellationToken cancellationToken)
    {
        return _queue.Reader.ReadAllAsync(cancellationToken);
    }
}