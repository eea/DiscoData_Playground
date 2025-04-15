// using OpenAI.Assistants;
// using OpenAI.Chat;
// using OpenAI.Assistants;
// using System;
// using System.ClientModel;
// using System.Threading.Tasks;

// namespace discoData_playground.Server.Services
// {
//     public class ChatGptService : IChatGptService
//     {
//         private ILogger _logger;
//         private ChatClient _chatClient;
// #pragma warning disable OPENAI001 // 'OpenAI.Assistants.Assistant' is for evaluation purposes only and is subject to change or removal in future updates.
//         private AssistantClient _assistantClient;
//         // #pragma warning restore OPENAI001

//         private readonly List<ChatMessage> _chatHistory = new();

//         public ChatGptService(ILogger<ChatGptService> logger)
//         {
//             _logger = logger;
//             _chatClient = new(model: "gpt-4o", apiKey: "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");
//             _assistantClient = new("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");
//         }

//         public async IAsyncEnumerable<List<ChatMessage>> StreamChatAsync(string prompt)
//         {
//             if (_chatHistory.Count == 0)
//             {
//                 _chatHistory.Add(ChatMessage.CreateSystemMessage(
//                     "You are an assistant that is expert in DREMIO and helps on user queries. " +
//                     "When asked to review their queries, fix the syntax and make sure it is compatible with DREMIO."
//                 ));
//             }

//             _chatHistory.Add(ChatMessage.CreateUserMessage(prompt));
//             var completionUpdates = _chatClient.CompleteChatStreamingAsync(_chatHistory);
//             _chatHistory.Add(ChatMessage.CreateAssistantMessage(""));

//             string fullResponse = "";

//             await foreach (var update in completionUpdates)
//             {
//                 if (update.ContentUpdate.Count > 0)
//                 {
//                     var chunk = update.ContentUpdate[0].Text;
//                     fullResponse += chunk;

//                     // Update the assistant message content in place
//                     var updatedMessage = ChatMessage.CreateUserMessage(fullResponse);
//                     _chatHistory[_chatHistory.Count - 1] = updatedMessage;

//                     // Yield the entire chat history with the updated last message
//                     yield return new List<ChatMessage>(_chatHistory);
//                 }
//             }
//         }
//     }
// }