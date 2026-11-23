export type CropImage = {
  src: string;
  alt: string;
};

const CROP_IMAGES: Array<{ matches: string[]; image: CropImage }> = [
  {
    matches: ["paddy", "rice"],
    image: { src: "/images/crops/rice.jpg", alt: "White rice grains beside a rice plant" },
  },
  {
    matches: ["red gram", "kandi", "pigeon pea", "toor"],
    image: {
      src: "/images/crops/red-gram.jpg",
      alt: "Split pigeon peas (toor dal)",
    },
  },
  {
    matches: ["turmeric"],
    image: { src: "/images/crops/turmeric.jpg", alt: "Turmeric roots and powder" },
  },
  {
    matches: ["red chilli", "red chili", "chilli", "chili"],
    image: { src: "/images/crops/red-chillies.jpg", alt: "Dried red chillies" },
  },
  {
    matches: ["maize", "corn"],
    image: { src: "/images/crops/maize.jpg", alt: "Fresh maize ears growing on the plant" },
  },
  {
    matches: ["jowar", "sorghum"],
    image: { src: "/images/crops/jowar-user.jpg", alt: "User-provided photograph of sorghum plants with grain heads" },
  },
  {
    matches: ["bajra", "pearl millet"],
    image: { src: "/images/crops/bajra.jpg", alt: "Pearl millet plants growing in a field" },
  },
  {
    matches: ["groundnut", "peanut"],
    image: { src: "/images/crops/groundnuts.jpg", alt: "Groundnuts with shells and kernels" },
  },
  {
    matches: ["cotton"],
    image: { src: "/images/crops/cotton.jpg", alt: "Cotton boll growing on a cotton plant" },
  },
  {
    matches: ["tomato"],
    image: { src: "/images/crops/tomato.jpg", alt: "Ripe tomatoes growing on the vine" },
  },
  {
    matches: ["bengal gram", "chickpea", "chana"],
    image: { src: "/images/crops/chickpea-user.jpg", alt: "User-provided photograph of chickpea plants" },
  },
  {
    matches: ["onion"],
    image: { src: "/images/crops/onion-user.jpg", alt: "User-provided photograph of onions growing in a field" },
  },
  {
    matches: ["sesame", "til"],
    image: { src: "/images/crops/sesame.jpg", alt: "Sesame plant with seed pods" },
  },
  {
    matches: ["green gram", "mung bean", "pesalu"],
    image: { src: "/images/crops/green-gram-user.jpg", alt: "User-provided photograph of green gram pods" },
  },
  {
    matches: ["sugarcane"],
    image: { src: "/images/crops/sugarcane.jpg", alt: "User-provided photograph of sugarcane plants" },
  },
  {
    matches: ["soybean", "soya bean", "soyabean"],
    image: { src: "/images/crops/soybean.jpg", alt: "User-provided photograph of soybeans growing in a field" },
  },
  {
    matches: ["castor"],
    image: { src: "/images/crops/castor.jpg", alt: "User-provided photograph of castor seeds" },
  },
  {
    matches: ["oil palm"],
    image: { src: "/images/crops/oil-palm.jpg", alt: "User-provided photograph of an oil palm tree with fruit bunches" },
  },
  {
    matches: ["black gram", "urad"],
    image: { src: "/images/crops/black-gram.jpg", alt: "User-provided photograph of black gram plants and seeds" },
  },
  {
    matches: ["sunflower"],
    image: { src: "/images/crops/sunflower.jpg", alt: "User-provided photograph of a sunflower field" },
  },
  {
    matches: ["sweet lime", "mosambi"],
    image: { src: "/images/crops/sweet-lime.jpg", alt: "User-provided photograph of sweet lime fruit on a tree" },
  },
  {
    matches: ["mango"],
    image: { src: "/images/crops/mango.jpg", alt: "User-provided photograph of mangoes growing on a tree" },
  },
  {
    matches: ["ginger"],
    image: { src: "/images/crops/ginger.jpg", alt: "User-provided photograph of freshly harvested ginger roots" },
  },
  {
    matches: ["custard apple", "sitaphal"],
    image: { src: "/images/crops/custard-apple.jpg", alt: "User-provided photograph of custard apples growing on a tree" },
  },
  {
    matches: ["guava"],
    image: { src: "/images/crops/guava.jpg", alt: "User-provided photograph of guavas growing on a tree" },
  },
];

export function getCropImage(cropName: string): CropImage | undefined {
  const normalizedName = cropName.trim().toLowerCase();
  return CROP_IMAGES.find(({ matches }) =>
    matches.some((match) => normalizedName.includes(match)),
  )?.image;
}
