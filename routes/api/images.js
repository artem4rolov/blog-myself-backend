const express = require("express");
const router = express.Router();
var imgModel = require("./models/Image");

router.post("/", upload.single("image"), (req, res, next) => {
  var obj = {
    img: {
      data: fs.readFileSync(
        path.join(__dirname + "/uploads/" + req.file.filename)
      ),
      contentType: "image/png",
    },
  };
  imgModel.create(obj, (err, item) => {
    if (err) {
      console.log(err);
    } else {
      // item.save();
      res.redirect("/");
    }
  });
});

router.get("/", (req, res) => {
  imgModel.find({}, (err, items) => {
    if (err) {
      console.log(err);
      res.status(500).send("An error occurred", err);
    } else {
      res.render("imagesPage", { items: items });
    }
  });
});

module.exports = router;
