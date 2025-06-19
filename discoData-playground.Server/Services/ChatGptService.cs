using OpenAI.Managers;
using OpenAI;
using OpenAI.ObjectModels.RequestModels;
using Microsoft.AspNetCore.Http.HttpResults;
using discoData_playground.Server.Class;
using System.Text;
using System.Net.Http.Headers;
using System.Text.Json;

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

        const string apiKeyLocal = "sk-2VC-92JgQftvbDMUAuXsKQ";
        const string baseUrlLocal = "https://llmgw.eea.europa.eu/v1/chat/completions";
        const string modelLocal = "Inhouse-LLM/Mistral-Small-3.1-24B-Instruct-2503";

        public ChatGptService(ILogger<ChatGptService> logger)
        {
            _logger = logger;
            _openAIService = new OpenAIService(new OpenAiOptions { ApiKey = "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" });
        }

        public async IAsyncEnumerable<string> StreamChatLocal(List<ChatMessage> chatList)
        {
            using var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKeyLocal);

            if (chatList == null)
            {
                chatList = new List<ChatMessage>();
            }

            // Ensure first message is always the system message
            var systemMessage = ChatMessage.FromSystem(BuildSystemPrompt());

            if (chatList.Count > 0 && chatList[0].Role == OpenAI.ObjectModels.StaticValues.ChatMessageRoles.System)
            {
                chatList[0] = systemMessage; // replace old system prompt
            }
            else
            {
                chatList.Insert(0, systemMessage); //s insert if missing
            }

            //Convert ChatMessage list using openAI class to anonimous messages for httpRequest to Antonio machine
            var messagesAntonio = chatList.Select(msg => new { role = msg.Role, content = msg.Content }).ToArray();

            var payload = new
            {
                model = modelLocal,
                messages = messagesAntonio,
                stream = true
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            using var response = await client.PostAsync(baseUrlLocal, content);
            using var stream = await response.Content.ReadAsStreamAsync();
            using var reader = new StreamReader(stream);
            
             while (!reader.EndOfStream)
            {
                  var line = await reader.ReadLineAsync();
                  if (string.IsNullOrWhiteSpace(line)) continue;
                  if (!line.StartsWith("data: ")) continue;

                  var jsonData = line["data: ".Length..];
                  if (jsonData == "[DONE]") break;


                  using var doc = JsonDocument.Parse(jsonData);

                  if (doc.RootElement.TryGetProperty("choices", out var choices) &&
                      choices.GetArrayLength() > 0 &&
                      choices[0].TryGetProperty("delta", out var delta) &&
                      delta.TryGetProperty("content", out var contentElement))
                  {
                        var contentPart = contentElement.GetString();
                        if (!string.IsNullOrEmpty(contentPart))
                        {
                            await Task.Delay(15); 
                            yield return contentPart;
                        }
                  }

            }
        }
        
        public async IAsyncEnumerable<string> StreamChatCloud(List<ChatMessage> chatList)
        {
            if (chatList == null)
            {
                chatList = new List<ChatMessage>();
            }

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
            const string basePrompt =
 "You are an assistant that is an expert in Dremio and help users with their SQL queries. " +
 "When reviewing or generating queries, ensure the syntax is compatible with Dremio. " +
 "Do not break the data source path into separate quoted components. " +
 "Always use the format: \"full.schema.path\".\"table\" " +
 "Always include LIMIT 200 at the end of queries to prevent returning too many rows.";


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