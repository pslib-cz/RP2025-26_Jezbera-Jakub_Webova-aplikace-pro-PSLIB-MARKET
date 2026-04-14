import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { API_BASE_URL, getTags, type Tag } from "../../services/apiService";
import styles from "./AdForm.module.css";
import { useAuth } from "react-oidc-context";

const CONDITIONS = [
  { value: "VeryGood", label: "Velmi dobrý" },
  { value: "Good", label: "Dobrý" },
  { value: "Scribbled", label: "Popsaný" },
  { value: "Damaged", label: "Poškozený" },
] as const;

const adSchema = z.object({
  title: z.string().trim().min(1, "Jméno knihy je povinné"),
  subject: z.string().trim().min(1, "Předmět je povinný"),
  condition: z.string().trim().min(1, "Vyber stav"),
  photo: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "Foto učebnice je povinné"),
  price: z
    .string()
    .trim()
    .min(1, "Cena je povinná")
    .refine((value) => !Number.isNaN(Number(value)), "Cena musí být číslo")
    .transform((value) => Number(value))
    .refine((value) => value >= 0, "Cena nesmí být záporná"),
  description: z.string().trim().optional(),
});

type AdFormInput = z.input<typeof adSchema>;
type AdFormValues = z.output<typeof adSchema>;

const AdForm = () => {
  const [fileName, setFileName] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const auth = useAuth(); 


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdFormInput, unknown, AdFormValues>({
    resolver: zodResolver(adSchema),
  });
  const photoRegister = register("photo");

  useEffect(() => {
    const loadTags = async () => {
      try {
        const fetchedTags = await getTags();
        setTags(fetchedTags);
      } catch {
        setTags([]);
      }
    };

    loadTags();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName("");
    }
  };

  const onSubmit = async (data: AdFormValues) => {
    try {
      console.log(data);
      const token = auth.user?.access_token;
      if (!token) return alert("Nejste přihlášený");

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("subject", data.subject);
      formData.append("condition", data.condition);
      formData.append("photo", data.photo[0]);
      formData.append("price", data.price.toString());
      formData.append("description", data.description || "");

      const response = await fetch(`${API_BASE_URL}/books`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) return alert("Chyba při odesílání inzerátu");

      console.log("Inzerát úspěšně odeslán");
    } catch (error) {
      console.error("Chyba při odesílání inzerátu", error);
      alert("Chyba při odesílání inzerátu");
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      <div className={`${styles.field} ${styles.nameField}`}>
        <label className={styles.label} htmlFor="title">
          Jméno knihy
          <span className={styles.required}>*</span>
        </label>
        <input
          id="title"
          type="text"
          {...register("title")}
          className={styles.input}
        />
        {errors.title &&
          <p className={styles.error}>{errors.title.message}</p>}
      </div>

      <div className={`${styles.field} ${styles.subjectField}`}>
        <label className={styles.label} htmlFor="subject">
          Předmět
          <span className={styles.required}>*</span>
        </label>
        <select
          id="subject"
          defaultValue=""
          {...register("subject")}
          className={styles.input}
        >
          <option value="" disabled>
            Vyber předmět
          </option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.name}>
              {tag.name}
            </option>
          ))}
        </select>
        {errors.subject && (
          <p className={styles.error}>{errors.subject.message}</p>
        )}
      </div>

      <div className={`${styles.field} ${styles.conditionField}`}>
        <label className={styles.label} htmlFor="condition">
          Stav
          <span className={styles.required}>*</span>
        </label>
        <select
          id="condition"
          defaultValue=""
          {...register("condition")}
          className={styles.input}
        >
          <option value="" disabled>
            Vyber stav
          </option>
          {CONDITIONS.map((condition) => (
            <option key={condition.value} value={condition.value}>
              {condition.label}
            </option>
          ))}
        </select>
        {errors.condition && (
          <p className={styles.error}>{errors.condition.message}</p>
        )}
      </div>

      <div className={styles.photoPriceRow}>
        <div className={`${styles.field} ${styles.photoField}`}>
          <label className={styles.label} htmlFor="photo">
            Foto učebnice
            <span className={styles.required}>*</span>
          </label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            {...photoRegister}
            onChange={(e) => {
              photoRegister.onChange(e);
              handleFileChange(e);
            }}
            className={styles.fileInput}
          />
          <label htmlFor="photo" className={styles.fileLabel}>
            <span>{fileName || "Nahrát obrázek"}</span>
            <svg
              width="17"
              height="15"
              viewBox="0 0 17 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.6667 11.5625H12.675M11.5 9.125H13.5C14.2766 9.125 14.6648 9.125 14.9712 9.24866C15.3795 9.4136 15.704 9.72999 15.8732 10.1281C16 10.4268 16 10.8053 16 11.5625C16 12.3197 16 12.6982 15.8732 12.9969C15.704 13.395 15.3795 13.7114 14.9712 13.8763C14.6648 14 14.2766 14 13.5 14H3.5C2.72343 14 2.33515 14 2.02886 13.8763C1.62048 13.7114 1.29603 13.395 1.12687 12.9969C1 12.6982 1 12.3197 1 11.5625C1 10.8053 1 10.4268 1.12687 10.1281C1.29603 9.72999 1.62048 9.4136 2.02886 9.24866C2.33515 9.125 2.72343 9.125 3.5 9.125H5.5M8.5 9.9375V1M8.5 1L11 3.4375M8.5 1L6 3.4375"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </label>
          {errors.photo && (
            <p className={styles.error}>{errors.photo.message}</p>
          )}
        </div>

        <div className={`${styles.field} ${styles.priceField}`}>
          <label className={styles.label} htmlFor="price">
            Cena
            <span className={styles.required}>*</span>
          </label>
          <div className={styles.priceInputWrap}>
            <input
              id="price"
              type="number"
              min={0}
              step="1"
              {...register("price")}
              className={`${styles.input} ${styles.priceInput}`}
            />
            <span className={styles.priceSuffix}>Kč</span>
          </div>
          {errors.price && (
            <p className={styles.error}>{errors.price.message}</p>
          )}
        </div>
      </div>

      <div className={`${styles.field} ${styles.descriptionField}`}>
        <label className={styles.label} htmlFor="description">
          Popisek
        </label>
        <textarea
          id="description"
          rows={4}
          {...register("description")}
          className={styles.input}
        />
        {errors.description && (
          <p className={styles.error}>{errors.description.message}</p>
        )}
      </div>

      <div className={styles.submitButtonWrap}>
        <button className={styles.publishButton} type="submit">
          Publikovat
        </button>
      </div>
    </form>
  );
};

export default AdForm;
