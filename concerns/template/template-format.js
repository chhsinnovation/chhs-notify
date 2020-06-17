const rdsRecord = (rdsResponse) => ({
  Template: {
    Id: rdsResponse.id,
    Url: `${process.env.URL_BASE}/templates/${rdsResponse.id}`,
    Key: rdsResponse.key,
    Channel: rdsResponse.channel,
    Description: rdsResponse.description,
    Content: rdsResponse.content
  }
});

module.exports = {
  rdsRecord
}