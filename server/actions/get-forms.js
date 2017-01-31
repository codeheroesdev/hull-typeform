export default function getForms(req, res) {
  const { typeformClient } = req.shipApp;

  if (!typeformClient.ifConfigured()) {
    return res.json({ options: [] });
  }

  return typeformClient.get("/forms")
    .then(({ body: forms }) => {
      res.json({
        options: forms.map(f => {
          return { label: f.name, value: f.id };
        })
      });
    })
    .catch(() => {
      res.json({ options: [] });
    });
}
