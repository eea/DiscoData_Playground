using System.Collections.Generic;
using System.Timers;
using discoData_playground.Server.Class;
using OpenAI;
using OpenAI.ObjectModels.RequestModels;

namespace discoData_playground.Server.Services
{
    public interface IChatGptService
    {
        IAsyncEnumerable<string> StreamChatCloud(List<ChatMessage> history);
         IAsyncEnumerable<string> StreamChatLocal(List<ChatMessage> history);


        void UploadContext(ChatGptContext context);

    }
}