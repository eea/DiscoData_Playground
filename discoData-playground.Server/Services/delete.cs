
      //   public async IAsyncEnumerable<string> StreamChatAsync2(List<ChatMessage> chatList)
      //   {
      //       using var client = new HttpClient();
      //       client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

      //       if (chatList == null)
      //       {
      //           chatList = new List<ChatMessage>();
      //       }

      //       // Ensure first message is always the system message
      //       var systemMessage = ChatMessage.FromSystem(BuildSystemPrompt());

      //       if (chatList.Count > 0 && chatList[0].Role == OpenAI.ObjectModels.StaticValues.ChatMessageRoles.System)
      //       {
      //           chatList[0] = systemMessage; // replace old system prompt
      //       }
      //       else
      //       {
      //           chatList.Insert(0, systemMessage); // insert if missing
      //       }

      //       //Convert ChatMessage list using openAI class to anonimous messages for httpRequest to Antonio machine
      //       var messagesAntonio = chatList.Select(msg => new { role = msg.Role, content = msg.Content }).ToArray();

      //       var payload = new
      //       {
      //           model = model,
      //           messages = messagesAntonio,
      //           stream = true
      //       };

      //       var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

      //       using var response = await client.PostAsync(baseUrl, content);
      //       using var stream = await response.Content.ReadAsStreamAsync();
      //       using var reader = new StreamReader(stream);
            
      //        while (!reader.EndOfStream)
      //       {
      //             var line = await reader.ReadLineAsync();
      //             if (string.IsNullOrWhiteSpace(line)) continue;
      //             if (!line.StartsWith("data: ")) continue;

      //             var jsonData = line["data: ".Length..];
      //             if (jsonData == "[DONE]") break;


      //             using var doc = JsonDocument.Parse(jsonData);

      //             if (doc.RootElement.TryGetProperty("choices", out var choices) &&
      //                 choices.GetArrayLength() > 0 &&
      //                 choices[0].TryGetProperty("delta", out var delta) &&
      //                 delta.TryGetProperty("content", out var contentElement))
      //             {
      //                   var contentPart = contentElement.GetString();
      //                   if (!string.IsNullOrEmpty(contentPart))
      //                   {
      //                       await Task.Delay(15); 
      //                       yield return contentPart;
      //                   }
      //             }

      //       }
      //   }