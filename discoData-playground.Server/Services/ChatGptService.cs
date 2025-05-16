using OpenAI.Managers;
using OpenAI;
using OpenAI.ObjectModels.RequestModels;
using Microsoft.AspNetCore.Http.HttpResults;
using discoData_playground.Server.Class;
using System.Text;

// key for EEA GPU1
// sk-2VC-92JgQftvbDMUAuXsKQ
// how to connect to GPU1 ????

namespace discoData_playground.Server.Services
{
    public class ChatGptService : IChatGptService
    {
        public ChatGptContext Context { get; set; }
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
            // if (!chatList.Any(m => m.Role == OpenAI.ObjectModels.StaticValues.ChatMessageRoles.System))
            // {
            //     chatList.Insert(0, ChatMessage.FromSystem(SystemPrompt));

            //     //load here all column from the table the user work on
            // }

            // Ensure first message is always the system message
            var systemMessage = ChatMessage.FromSystem(BuildSystemPrompt());

            if (chatList.Count > 0 && chatList[0].Role == OpenAI.ObjectModels.StaticValues.ChatMessageRoles.System)
            {
                chatList[0] = systemMessage; // replace old system prompt
            }
            else
            {
                chatList.Insert(0, systemMessage); // insert if missing
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

        public void UploadContext(ChatGptContext context)
        {
            this.Context = context;
        }

        private string BuildSystemPrompt()
        {
            var basePrompt = "You are an assistant that is expert in DREMIO and helps on user queries. " +
                             "When asked to review their queries, fix the syntax and make sure it is compatible with DREMIO.";

            if (Context == null)
                return basePrompt;

            var contextSummary = new StringBuilder();
            contextSummary.AppendLine("The user is currently working with the following data context:");

            foreach (var schema in Context.ChatContext)
            {
                contextSummary.AppendLine($"- Schema: {schema.SchemaName}");
                foreach (var table in schema.Tables)
                {
                    contextSummary.AppendLine($"  - Table: {table.TableName}");
                    var columnNames = table.Columns?.Select(c => c.COLUMN_NAME).ToList();
                    if (columnNames != null && columnNames.Any())
                    {
                        contextSummary.AppendLine($"    - Columns: {string.Join(", ", columnNames.Take(10))}...");
                    }
                }
            }

            return $"{basePrompt}\n\n{contextSummary}";
        }

    }
}