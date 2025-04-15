using OpenAI.Managers;
using OpenAI;
using OpenAI.ObjectModels.RequestModels;

namespace discoData_playground.Server.Services
{
    public class ChatGptService : IChatGptService
    {
        private ILogger _logger;
        private OpenAIService _openAIService;
        private const string SystemPrompt =
            "You are an assistant that is expert in DREMIO and helps on user queries. " +
            "When asked to review their queries, fix the syntax and make sure it is compatible with DREMIO.";

        public ChatGptService(ILogger<ChatGptService> logger)
        {
            _logger = logger;
            _openAIService = new OpenAIService(new OpenAiOptions { ApiKey = "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" });
        }

        public async IAsyncEnumerable<string> StreamChatAsync(List<ChatMessage> chatList)
        {
            if (chatList == null)
            {
                chatList = new List<ChatMessage>();
            }

            // Add system prompt once
            if (!chatList.Any(m => m.Role == OpenAI.ObjectModels.StaticValues.ChatMessageRoles.System))
            {
                chatList.Insert(0, ChatMessage.FromSystem(SystemPrompt));
            }

            var response = _openAIService.ChatCompletion.CreateCompletionAsStream(new ChatCompletionCreateRequest
            {
                Model = "gpt-4o",
                Temperature = 0.7f,
                MaxTokens = 3000,
                TopP = 0.95f,
                Messages = chatList,
                Stream = true
            });

            string assistantReply = "";

            await foreach (var result in response)
            {
                if (!result.Successful)
                {
                    _logger.LogError($"ChatGPT call failed: {result.HttpStatusCode}");
                }
                else
                {
                    var chunk = result.Choices[0].Message.Content;
                    assistantReply += chunk;
                    yield return chunk;
                }
            }
        }
    }
}