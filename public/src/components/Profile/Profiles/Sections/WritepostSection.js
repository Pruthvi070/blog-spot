import LoaderSmall from "../../../Loader/LoaderSmall";
import Message from "../../../Message/Message";
import styles from "./Profilesection.module.css";
import { useState, useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";

const tinyApiKey = process.env.REACT_APP_TINYMCE_API_KEY;
const apiUrl = process.env.REACT_APP_SERVER_URL || "http://localhost:3030";

const WritePostSection = (props) => {
  const editorRef = useRef(null);
  console.log('WritePostSection props:', props);
  console.log('Categories:', props.postCategory);
  
  const [inputData, setInputHandler] = useState({
    title: "",
    desc: "",
    content: "",
    category: "",
    imgSource: "",
    tag: "",
    status: "",
    image: "",
  });
  const [isSmallLaoder, setSmallLoader] = useState(false);
  const [message, setMessage] = useState("");
  const [isMessage, setIsMesssage] = useState(false);
  const [messageType, setMessageType] = useState("");

  const [isInputError, setInputError] = useState({
    title: false,
    desc: false,
    content: false,
    category: false,
    imgSource: false,
    tag: false,
    status: false,
    image: false,
  });

  const crossHandler = (value) => {
    setIsMesssage(value);
  };

  const inputHandler = (e) => {
    const { name, value } = e.target;

    setInputHandler((pre) => {
      return { ...pre, [name]: value };
    });

    setInputError((prev) => ({
      ...prev,
      [name]: false,
    }));
  };

  const imageHandler = (e) => {
    const { name, files } = e.target;

    setInputHandler((pre) => {
      return { ...pre, [name]: files[0] };
    });
  };

  const onSubmitHandler = (e) => {
    e.preventDefault();

    if (!inputData.image || !inputData.image.name) {
      setInputError((pre) => {
        return { ...pre, image: true };
      });
      setMessage("Please select an image file");
      setMessageType("error");
      setIsMesssage(true);
      return;
    }

    if (inputData.title.length < 10) {
      setInputError((pre) => {
        return { ...pre, title: true };
      });
      return;
    }
    if (inputData.desc.length < 10) {
      setInputError((pre) => {
        return { ...pre, desc: true };
      });
      return;
    }
    if (inputData.category.length <= 0) {
      setInputError((pre) => {
        return { ...pre, category: true };
      });
      return;
    }

    if (inputData.imgSource.length <= 0) {
      setInputError((pre) => {
        return { ...pre, imgSource: true };
      });
      return;
    }

    if (inputData.tag.length <= 0) {
      setInputError((pre) => {
        return { ...pre, tag: true };
      });
      return;
    }

    if (inputData.status.length <= 0) {
      setInputError((pre) => {
        return { ...pre, status: true };
      });
      return;
    }

    setSmallLoader(true);

    let content;

    if (editorRef.current) {
      content = editorRef.current.getContent();
    } else {
      throw new Error("tiny editor error");
    }

    const url = apiUrl + "/post/addpost";

    const formData = new FormData();
    formData.append("title", inputData.title);
    formData.append("category", inputData.category);
    formData.append("content", content);
    formData.append("desc", inputData.desc);
    formData.append("image", inputData.image);
    formData.append("imageSource", inputData.imgSource);
    formData.append("status", inputData.status);
    formData.append("tag", inputData.tag);

    fetch(url, {
      method: "POST",
      body: formData,
      credentials: "include",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Upload failed');
        }
        return data;
      })
      .then((data) => {
        if (data?.data === "invalid token") {
          props.logout("session");
        } else if (data?.error === "yes") {
          throw new Error(data.message || "server error");
        } else {
          setSmallLoader(false);
          setIsMesssage(true);
          setMessageType("message");
          setMessage("Upload Success!");
        }
      })
      .catch((err) => {
        setSmallLoader(false);
        setIsMesssage(true);
        setMessageType("error");
        setMessage(err.message || "Upload Failed!");
        console.log(err);
      });
    setInputHandler({
      title: "",
      desc: "",
      content: "",
      category: "",
      imgSource: "",
      tag: "",
      status: "",
      image: "",
    });
  };

  const selectOptions = props.postCategory && props.postCategory.length > 0 ? (
    props.postCategory.map((data) => {
      console.log('Rendering category option:', data);
      return (
        <option value={data._id} key={data._id}>
          {data.name}
        </option>
      );
    })
  ) : (
    <option value="" disabled>No categories available</option>
  );

  return (
    <div className={styles["profile-main"]}>
      {isSmallLaoder && (
        <div className={styles["small-loader"]}>
          <LoaderSmall />
        </div>
      )}
      {isMessage && (
        <Message type={messageType} message={message} cross={crossHandler} />
      )}

      <h3>Write New Blog</h3>
      <form 
        action="" 
        method="post" 
        onSubmit={onSubmitHandler} 
        encType="multipart/form-data"
        noValidate
      >
        <div className={styles["profile-sub"]}>
          <div
            className={`${styles["section"]} ${
              isInputError.title ? styles["invalid"] : ""
            }`}
          >
            <label htmlFor="">Title</label>
            <input
              onChange={inputHandler}
              name="title"
              type="text"
              value={inputData.title}
            ></input>
          </div>
          <div
            className={`${styles["section"]} ${
              isInputError.desc ? styles["invalid"] : ""
            }`}
          >
            <label htmlFor="">Short Description</label>
            <input
              onChange={inputHandler}
              name="desc"
              type="text"
              value={inputData.desc}
            ></input>
          </div>
          <div
            className={`${styles["section"]} ${
              isInputError.content ? styles["invalid"] : ""
            }`}
          >
            <label htmlFor="">Content</label>
            <Editor
              apiKey={tinyApiKey}
              onInit={(evt, editor) => {
                editorRef.current = editor;
                console.log('TinyMCE initialized with API key:', tinyApiKey);
              }}
              onEditorChange={(content, editor) => {
                console.log('Content updated:', content);
              }}
              initialValue=""
              init={{
                height: 500,
                menubar: true,
                plugins: [
                  "advlist",
                  "autolink",
                  "lists",
                  "link",
                  "image",
                  "charmap",
                  "preview",
                  "anchor",
                  "searchreplace",
                  "visualblocks",
                  "code",
                  "fullscreen",
                  "insertdatetime",
                  "media",
                  "table",
                  "code",
                  "help",
                  "wordcount",
                ],
                toolbar:
                  "undo redo | blocks | " +
                  "bold italic forecolor | alignleft aligncenter " +
                  "alignright alignjustify | bullist numlist outdent indent | " +
                  "removeformat | help",
                content_style:
                  "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                setup: (editor) => {
                  editor.on('init', () => {
                    console.log('Editor is initialized');
                  });
                  editor.on('error', (e) => {
                    console.error('Editor error:', e);
                  });
                }
              }}
            />
          </div>
          <div
            className={`${styles["section"]} ${
              isInputError.category ? styles["invalid"] : ""
            }`}
          >
            <label htmlFor="">Category</label>
            <select
              value={inputData.category}
              onChange={inputHandler}
              name="category"
            >
              <option value="">Select Category</option>
              {selectOptions}
            </select>
          </div>
          <div className={styles["section"]}>
            <label htmlFor="image">Image</label>
            <div className={styles["image"]}>
              <p className={styles["image-file-name"]}>
                {inputData.image.name ||
                  "Select Image File type. Only JPEG, PNG, and JPG are allowed "}
              </p>
              <input 
                onChange={imageHandler} 
                name="image" 
                id="image"
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                required
              ></input>
              <img
                width="64"
                height="64"
                src="https://img.icons8.com/pastel-glyph/64/image--v2.png"
                alt="file"
              />
            </div>
          </div>
          <div
            className={`${styles["section"]} ${
              isInputError.imgSource ? styles["invalid"] : ""
            }`}
          >
            <label htmlFor="">Image source</label>
            <input
              value={inputData.imgSource}
              onChange={inputHandler}
              name="imgSource"
              type="text"
            ></input>
          </div>
          <div
            className={`${styles["section"]} ${
              isInputError.tag ? styles["invalid"] : ""
            }`}
          >
            <label htmlFor="">Tag</label>
            <input
              value={inputData.tag}
              onChange={inputHandler}
              name="tag"
              type="text"
            ></input>
          </div>
          <div
            className={`${styles["section"]} ${
              isInputError.status ? styles["invalid"] : ""
            }`}
          >
            <label htmlFor="">Status</label>
            <select
              value={inputData.status}
              onChange={inputHandler}
              name="status"
            >
              <option value="">Select Status</option>
              <option value="publish">Publish</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        <div className={styles["button"]}>
          <button type="submit">Post Blog</button>
        </div>
      </form>
    </div>
  );
};

export default WritePostSection;
