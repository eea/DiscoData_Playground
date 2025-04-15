using System.Collections.Generic;
using System.Timers;
using OpenAI;
using OpenAI.ObjectModels.RequestModels;

namespace discoData_playground.Server.Services
{
    public interface IChatGptService
    {   
         IAsyncEnumerable<string> StreamChatAsync(List<ChatMessage> history);
    }
}