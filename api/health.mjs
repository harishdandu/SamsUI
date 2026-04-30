export default function handler(req, res) {
  console.log("HEALTH CHECK: Function is alive!");
  res.status(200).json({ status: "ok", message: "API is working" });
}
