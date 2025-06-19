using System.Text.Json;
using discoData_playground.Server.Class;
using discoData_playground.Server.Services;
using Microsoft.AspNetCore.Mvc;
// using OpenAI.ObjectModels.RequestModels;

namespace discoData_playground.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ChatGptController : ControllerBase
    {
        private readonly IChatGptService _chatGptService;
        private readonly ILogger<ChatGptController> _logger;

        public ChatGptController(IChatGptService chatGptService, ILogger<ChatGptController> logger)
        {
            _logger = logger;
            _chatGptService = chatGptService;
        }

        [HttpPost("StreamChat")]
        public async Task StreamChat([FromBody] ChatGptMessage request)
        {
            Response.ContentType = "text/event-stream"; // SSE for streaming

            await foreach (var chunk in _chatGptService.StreamChatCloud(request.History))
            {
                var json = JsonSerializer.Serialize(new { content = chunk });
                await Response.WriteAsync($"data:{json}\n");
                await Response.Body.FlushAsync();
            }
        }

        // [HttpPost("UploadContext")]
        // public IActionResult UploadContext([FromBody] Object context)
        // {
        //     Response.ContentType = "text/event-stream"; // SSE for streaming

        //    // _chatGptService.UploadContext(context);
        //     return Ok();
        // }

        [HttpPost("UploadContext")]
        public IActionResult UploadContext([FromBody] ChatGptContext context)
        {
            Response.ContentType = "text/event-stream"; // SSE for streaming

            _chatGptService.UploadContext(context);
            return Ok();
        }
    }
}