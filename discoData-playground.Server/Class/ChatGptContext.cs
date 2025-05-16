
namespace discoData_playground.Server.Class
{
      public class ChatGptContext
      {
            public List<DremioSchema> ChatContext { get; set; }
      }

      public class DremioSchema
      {
            public string SchemaName { get; set; }
            public List<TableInfo> Tables { get; set; }
      }

      public class TableInfo
      {
            public string TableName { get; set; }
            public List<ColumnInfo> Columns { get; set; }
      }

      public class ColumnInfo
      {
            public string COLUMN_NAME { get; set; }
            public int COLUMN_SIZE { get; set; }
            public int NUMERIC_PRECISION { get; set; }
            public string IS_NULLABLE { get; set; }
            public string DATA_TYPE { get; set; }
      }

}
