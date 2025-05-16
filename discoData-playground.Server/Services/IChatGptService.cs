using System.Collections.Generic;
using System.Timers;
using discoData_playground.Server.Class;
using OpenAI;
using OpenAI.ObjectModels.RequestModels;

namespace discoData_playground.Server.Services
{
    public interface IChatGptService
    {
        IAsyncEnumerable<string> StreamChatAsync(List<ChatMessage> history);

        void UploadContext(ChatGptContext context);
    }
}