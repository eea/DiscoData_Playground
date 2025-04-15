using OpenAI.ObjectModels.RequestModels;

namespace discoData_playground.Server.Class
{
    public class ChatGptMessage
    {
        public List<ChatMessage> History { get; set; } = new();
    }
}
