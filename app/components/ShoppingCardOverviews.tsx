"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  QuestionMarkCircleIcon,
  XMarkIcon as XMarkIconMini,
} from "@heroicons/react/20/solid";

import { useCart } from "@/app/context/CartContext";
import type { Locale } from "../lib/locale";

type ShoppingCardOverviewsProps = {
  shoppingCart: string;
  description: string;
  orderSummary: string;
  subtotal: string;
  shippingEstimate: string;
  taxEstimate: string;
  total: string;
  checkout: string;
  shippingEstimateInfo: string;
  taxEstimateInfo: string;
  empty: string;
  emptyDescription: string;
  CTAAdd: string;
  lang: Locale;
};

type QuoteFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  website: string;
};

type DeliveryText = {
  countryLabel: string;
  countryPlaceholder: string;
  selectCountryTitle: string;
  selectCountryMessage: string;
  standardTitle: string;
  standardMessage: string;
  quoteTitle: string;
  quoteMessage: string;
  pending: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  submitQuote: string;
  submittingQuote: string;
  successTitle: string;
  successMessage: string;
  requestNumber: string;
  errorMessage: string;
  selectCountryButton: string;
  clearCart: string;
  continueShopping: string;
  loading: string;
  removeProduct: string;
  decreaseQuantity: string;
  increaseQuantity: string;
  viewProduct: string;
  previousPage: string;
  nextPage: string;
  page: string;
  pageOf: string;
};

const EU_COUNTRY_CODES = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
] as const;

const EMPTY_QUOTE_FORM: QuoteFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address1: "",
  address2: "",
  city: "",
  postalCode: "",
  website: "",
};

const DELIVERY_TEXT: Record<
  Locale,
  DeliveryText
> = {
  en: {
    countryLabel: "Delivery country",
    countryPlaceholder: "Select a country",
    selectCountryTitle:
      "Select the delivery country",
    selectCountryMessage:
      "After selecting a country, we will show the available ordering method.",
    standardTitle:
      "Delivery within Estonia",
    standardMessage:
      "For orders up to and including €50, delivery within Estonia costs €6. You will enter the exact address at checkout.",
    quoteTitle:
      "Individual delivery quote",
    quoteMessage:
      "Enter the recipient details. We will calculate delivery and send one invoice for the products and delivery to the email address you provide. Nothing is charged now, and your cart will remain saved.",
    pending: "To be confirmed",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone (optional)",
    address1:
      "Street and house number",
    address2: "Apartment (optional)",
    city: "City",
    postalCode: "Postal code",
    submitQuote:
      "Request delivery quote",
    submittingQuote:
      "Sending request...",
    successTitle:
      "Your request has been sent",
    successMessage:
      "This request is already being processed. After calculating delivery, we will send the invoice to the email address you provided. Your cart will remain saved until payment.",
    requestNumber: "Request number",
    errorMessage:
      "The request could not be sent. Please try again.",
    selectCountryButton:
      "Select a delivery country",
    clearCart: "Clear cart",
    continueShopping:
      "← Continue shopping",
    loading: "Loading cart...",
    removeProduct: "Remove product",
    decreaseQuantity:
      "Decrease quantity",
    increaseQuantity:
      "Increase quantity",
    viewProduct: "View product",
    previousPage: "Previous",
    nextPage: "Next",
    page: "Page",
    pageOf: "of",
  },

  et: {
    countryLabel: "Tarneriik",
    countryPlaceholder: "Valige riik",
    selectCountryTitle:
      "Valige tarneriik",
    selectCountryMessage:
      "Pärast riigi valimist näitame teile sobivat tellimisviisi.",
    standardTitle: "Tarne Eestis",
    standardMessage:
      "Kuni 50 € tellimuste tarne Eestis maksab 6 €. Täpse aadressi sisestate kassas.",
    quoteTitle:
      "Individuaalne tarnepakkumine",
    quoteMessage:
      "Sisestage saaja andmed. Arvutame tarne hinna ning saadame toodete ja tarne eest ühe arve teie sisestatud e-posti aadressile. Praegu tasuma ei pea ja ostukorv säilib.",
    pending: "Täpsustamisel",
    firstName: "Eesnimi",
    lastName: "Perekonnanimi",
    email: "E-post",
    phone: "Telefon (valikuline)",
    address1:
      "Tänav ja maja number",
    address2: "Korter (valikuline)",
    city: "Linn",
    postalCode: "Postiindeks",
    submitQuote:
      "Küsi tarnepakkumist",
    submittingQuote:
      "Taotluse saatmine...",
    successTitle:
      "Teie taotlus on saadetud",
    successMessage:
      "Teie taotlus on juba töötlemisel. Pärast tarnekulu arvutamist saadame arve teie sisestatud e-posti aadressile. Ostukorv säilib kuni tasumiseni.",
    requestNumber:
      "Taotluse number",
    errorMessage:
      "Taotlust ei õnnestunud saata. Palun proovige uuesti.",
    selectCountryButton:
      "Valige tarneriik",
    clearCart: "Tühjenda ostukorv",
    continueShopping:
      "← Jätka ostlemist",
    loading:
      "Ostukorvi laadimine...",
    removeProduct: "Eemalda toode",
    decreaseQuantity:
      "Vähenda kogust",
    increaseQuantity:
      "Suurenda kogust",
    viewProduct: "Vaata toodet",
    previousPage: "Eelmine",
    nextPage: "Järgmine",
    page: "Lk",
    pageOf: "/",
  },

  fi: {
    countryLabel: "Toimitusmaa",
    countryPlaceholder: "Valitse maa",
    selectCountryTitle:
      "Valitse toimitusmaa",
    selectCountryMessage:
      "Kun olet valinnut maan, näytämme käytettävissä olevan tilaustavan.",
    standardTitle:
      "Toimitus Virossa",
    standardMessage:
      "Enintään 50 €:n tilausten toimitus Virossa maksaa 6 €. Tarkka osoite annetaan kassalla.",
    quoteTitle:
      "Yksilöllinen toimitustarjous",
    quoteMessage:
      "Anna vastaanottajan tiedot. Laskemme toimituskulut ja lähetämme yhden laskun tuotteista ja toimituksesta ilmoittamaasi sähköpostiosoitteeseen. Maksua ei veloiteta nyt ja ostoskori säilyy.",
    pending:
      "Vahvistetaan erikseen",
    firstName: "Etunimi",
    lastName: "Sukunimi",
    email: "Sähköposti",
    phone:
      "Puhelin (valinnainen)",
    address1: "Katuosoite",
    address2:
      "Asunto (valinnainen)",
    city: "Kaupunki",
    postalCode: "Postinumero",
    submitQuote:
      "Pyydä toimitustarjous",
    submittingQuote:
      "Pyyntöä lähetetään...",
    successTitle:
      "Pyyntösi on lähetetty",
    successMessage:
      "Pyyntösi on jo käsiteltävänä. Kun toimituskulut on laskettu, lähetämme laskun ilmoittamaasi sähköpostiosoitteeseen. Ostoskori säilyy maksuun asti.",
    requestNumber:
      "Pyynnön numero",
    errorMessage:
      "Pyyntöä ei voitu lähettää. Yritä uudelleen.",
    selectCountryButton:
      "Valitse toimitusmaa",
    clearCart:
      "Tyhjennä ostoskori",
    continueShopping:
      "← Jatka ostoksia",
    loading:
      "Ostoskoria ladataan...",
    removeProduct: "Poista tuote",
    decreaseQuantity:
      "Vähennä määrää",
    increaseQuantity:
      "Lisää määrää",
    viewProduct: "Näytä tuote",
    previousPage: "Edellinen",
    nextPage: "Seuraava",
    page: "Sivu",
    pageOf: "/",
  },

  uk: {
    countryLabel:
      "Країна доставки",
    countryPlaceholder:
      "Виберіть країну",
    selectCountryTitle:
      "Виберіть країну доставки",
    selectCountryMessage:
      "Після вибору країни ми покажемо доступний спосіб оформлення.",
    standardTitle:
      "Доставка по Естонії",
    standardMessage:
      "Для замовлень до 50 € включно доставка по Естонії коштує 6 €. Точну адресу ви вкажете під час оформлення.",
    quoteTitle:
      "Індивідуальний розрахунок доставки",
    quoteMessage:
      "Заповніть дані отримувача. Ми розрахуємо доставку та надішлемо один рахунок за товари й доставку на вказаний вами email. Зараз нічого оплачувати не потрібно, кошик збережеться.",
    pending: "Буде узгоджено",
    firstName: "Ім’я",
    lastName: "Прізвище",
    email: "Email",
    phone:
      "Телефон (необов’язково)",
    address1:
      "Вулиця та номер будинку",
    address2:
      "Квартира (необов’язково)",
    city: "Місто",
    postalCode:
      "Поштовий індекс",
    submitQuote:
      "Надіслати запит на доставку",
    submittingQuote:
      "Надсилання запиту...",
    successTitle:
      "Ваш запит надіслано",
    successMessage:
      "Ваш запит уже обробляється. Після розрахунку доставки ми надішлемо рахунок на вказаний вами email. Кошик збережеться до оплати.",
    requestNumber: "Номер запиту",
    errorMessage:
      "Не вдалося надіслати запит. Спробуйте ще раз.",
    selectCountryButton:
      "Виберіть країну доставки",
    clearCart: "Очистити кошик",
    continueShopping:
      "← Продовжити покупки",
    loading:
      "Завантаження кошика...",
    removeProduct:
      "Видалити товар",
    decreaseQuantity:
      "Зменшити кількість",
    increaseQuantity:
      "Збільшити кількість",
    viewProduct:
      "Переглянути товар",
    previousPage: "Назад",
    nextPage: "Далі",
    page: "Стор.",
    pageOf: "з",
  },

  ru: {
    countryLabel:
      "Страна доставки",
    countryPlaceholder:
      "Выберите страну",
    selectCountryTitle:
      "Выберите страну доставки",
    selectCountryMessage:
      "После выбора страны мы покажем доступный способ оформления.",
    standardTitle:
      "Доставка по Эстонии",
    standardMessage:
      "Для заказов до 50 € включительно доставка по Эстонии стоит 6 €. Точный адрес вы укажете во время оформления.",
    quoteTitle:
      "Индивидуальный расчёт доставки",
    quoteMessage:
      "Заполните данные получателя. Мы рассчитаем доставку и отправим один счёт на товары и доставку на указанный вами email. Сейчас ничего оплачивать не нужно, корзина сохранится.",
    pending:
      "Будет согласовано",
    firstName: "Имя",
    lastName: "Фамилия",
    email: "Email",
    phone:
      "Телефон (необязательно)",
    address1:
      "Улица и номер дома",
    address2:
      "Квартира (необязательно)",
    city: "Город",
    postalCode:
      "Почтовый индекс",
    submitQuote:
      "Отправить запрос на доставку",
    submittingQuote:
      "Отправка запроса...",
    successTitle:
      "Ваш запрос отправлен",
    successMessage:
      "Ваш запрос уже находится в обработке. После расчёта доставки мы отправим счёт на указанный вами email. Корзина сохранится до оплаты.",
    requestNumber:
      "Номер запроса",
    errorMessage:
      "Не удалось отправить запрос. Попробуйте ещё раз.",
    selectCountryButton:
      "Выберите страну доставки",
    clearCart:
      "Очистить корзину",
    continueShopping:
      "← Продолжить покупки",
    loading:
      "Загрузка корзины...",
    removeProduct:
      "Удалить товар",
    decreaseQuantity:
      "Уменьшить количество",
    increaseQuantity:
      "Увеличить количество",
    viewProduct:
      "Просмотреть товар",
    previousPage: "Назад",
    nextPage: "Вперёд",
    page: "Стр.",
    pageOf: "из",
  },
};

function getProductHandle(
  value: unknown
): string | null {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const record =
    value as Record<string, unknown>;

  const candidate =
    record.handle ??
    record.productHandle;

  return typeof candidate === "string" &&
    candidate.length > 0
    ? candidate
    : null;
}

export default function ShoppingCardOverviews({
  shoppingCart,
  description,
  orderSummary,
  subtotal,
  shippingEstimate,
  total,
  checkout,
  shippingEstimateInfo,
  empty,
  emptyDescription,
  CTAAdd,
  lang,
}: ShoppingCardOverviewsProps) {
  const {
    cart,
    isLoading,
    removeLine,
    updateLineQuantity,
    clearCart,
    deliveryQuoteStatus,
    deliveryQuoteRequestNumber,
    isCartLocked,
    refreshDeliveryQuoteStatus,
    markDeliveryQuotePending,
  } = useCart();

  const text =
    DELIVERY_TEXT[lang] ??
    DELIVERY_TEXT.en;

  const [page, setPage] =
    useState(1);

  const [
    selectedCountry,
    setSelectedCountry,
  ] = useState("");

  const [quoteForm, setQuoteForm] =
    useState<QuoteFormState>(
      EMPTY_QUOTE_FORM
    );

  const [
    isQuoteSubmitting,
    setIsQuoteSubmitting,
  ] = useState(false);

  const [
    quoteRequestNumber,
    setQuoteRequestNumber,
  ] = useState<string | null>(null);

  const [quoteError, setQuoteError] =
    useState("");

  const activeRequestNumber =
    quoteRequestNumber ??
    deliveryQuoteRequestNumber;

  const hasPendingQuote =
    deliveryQuoteStatus === "pending" ||
    Boolean(activeRequestNumber);

  const items = cart.lines;
  const hasItems = items.length > 0;

  const totalPrice = items.reduce(
    (sum, line) =>
      sum +
      line.unitPrice * line.quantity,
    0
  );

  const hasSelectedCountry =
    selectedCountry.length > 0;

  const standardEstoniaDelivery =
    selectedCountry === "EE" &&
    totalPrice <= 50;

  const requiresDeliveryQuote =
    hasSelectedCountry &&
    !standardEstoniaDelivery;

  const shippingCost =
    hasItems &&
    standardEstoniaDelivery
      ? 6
      : 0;

  const orderTotal =
    totalPrice + shippingCost;

  const countryOptions =
    useMemo(() => {
      const displayNames =
        new Intl.DisplayNames(
          [lang],
          {
            type: "region",
          }
        );

      return EU_COUNTRY_CODES.map(
        (code) => ({
          code,
          name:
            displayNames.of(code) ??
            code,
        })
      ).sort((a, b) => {
        if (a.code === "EE") {
          return -1;
        }

        if (b.code === "EE") {
          return 1;
        }

        return a.name.localeCompare(
          b.name,
          lang
        );
      });
    }, [lang]);

  const cartSignature = items
    .map(
      (line) =>
        `${line.merchandiseId}:${line.quantity}`
    )
    .join("|");

  useEffect(() => {
    if (isCartLocked) {
      return;
    }

    setQuoteRequestNumber(null);
    setQuoteError("");
  }, [
    cartSignature,
    selectedCountry,
    isCartLocked,
  ]);

  const PAGE_SIZE = 4;

  const totalPages = Math.max(
    1,
    Math.ceil(
      items.length / PAGE_SIZE
    )
  );

  const safePage = Math.min(
    page,
    totalPages
  );

  const startIndex =
    (safePage - 1) * PAGE_SIZE;

  const visibleItems = items.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  const showPagination =
    items.length > PAGE_SIZE;

  const updateQuoteField = (
    field: keyof QuoteFormState,
    value: string
  ) => {
    setQuoteForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCheckoutClick = () => {
    if (
      !cart.checkoutUrl ||
      !standardEstoniaDelivery ||
      hasPendingQuote
    ) {
      return;
    }

    /*
     * Здесь корзину не очищаем.
     * Если покупатель закроет Checkout,
     * товары должны остаться.
     */
    window.location.assign(
      cart.checkoutUrl
    );
  };

  const handleQuoteSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !requiresDeliveryQuote ||
      isQuoteSubmitting ||
      hasPendingQuote ||
      !cart.cartId
    ) {
      return;
    }

    setIsQuoteSubmitting(true);
    setQuoteError("");

    try {
      const response = await fetch(
        "/api/delivery-quote",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            countryCode:
              selectedCountry,

            customer: {
              firstName:
                quoteForm.firstName,
              lastName:
                quoteForm.lastName,
              email: quoteForm.email,
              phone: quoteForm.phone,
              address1:
                quoteForm.address1,
              address2:
                quoteForm.address2,
              city: quoteForm.city,
              postalCode:
                quoteForm.postalCode,
            },

            lines: items.map(
              (line) => ({
                merchandiseId:
                  line.merchandiseId,
                quantity: line.quantity,
              })
            ),

            cartId: cart.cartId,
            lang,
            website:
              quoteForm.website,
          }),
        }
      );

      const result =
        (await response.json()) as {
          requestNumber?: string;
          status?:
            | "pending"
            | "paid";
          alreadySubmitted?: boolean;
          error?: string;
        };

      if (
        !response.ok ||
        !result.requestNumber
      ) {
        throw new Error(
          result.error ??
            "DELIVERY_QUOTE_FAILED"
        );
      }

      if (result.status === "paid") {
        await refreshDeliveryQuoteStatus();
        return;
      }

      setQuoteRequestNumber(
        result.requestNumber
      );

      markDeliveryQuotePending(
        result.requestNumber
      );
    } catch (error: unknown) {
      console.error(
        "Delivery quote error:",
        error instanceof Error
          ? error.message
          : String(error)
      );

      setQuoteError(
        text.errorMessage
      );
    } finally {
      setIsQuoteSubmitting(false);
    }
  };

  const formFields: Array<{
    key: Exclude<
      keyof QuoteFormState,
      "website"
    >;
    label: string;
    type: string;
    autoComplete: string;
    required: boolean;
    fullWidth?: boolean;
  }> = [
    {
      key: "firstName",
      label: text.firstName,
      type: "text",
      autoComplete: "given-name",
      required: true,
    },
    {
      key: "lastName",
      label: text.lastName,
      type: "text",
      autoComplete: "family-name",
      required: true,
    },
    {
      key: "email",
      label: text.email,
      type: "email",
      autoComplete: "email",
      required: true,
      fullWidth: true,
    },
    {
      key: "phone",
      label: text.phone,
      type: "tel",
      autoComplete: "tel",
      required: false,
      fullWidth: true,
    },
    {
      key: "address1",
      label: text.address1,
      type: "text",
      autoComplete:
        "address-line1",
      required: true,
      fullWidth: true,
    },
    {
      key: "address2",
      label: text.address2,
      type: "text",
      autoComplete:
        "address-line2",
      required: false,
      fullWidth: true,
    },
    {
      key: "city",
      label: text.city,
      type: "text",
      autoComplete:
        "address-level2",
      required: true,
    },
    {
      key: "postalCode",
      label: text.postalCode,
      type: "text",
      autoComplete:
        "postal-code",
      required: true,
    },
  ];

  return (
    <div>
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
        <h1 className="max-w-md text-3xl font-semibold tracking-tight text-yellow-400">
          {shoppingCart}
        </h1>

        {isLoading &&
        !cart.cartId ? (
          <p className="mt-8 text-gray-400">
            {text.loading}
          </p>
        ) : (
          <div className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
            <section
              aria-labelledby="cart-heading"
              className="lg:col-span-7"
            >
              <h2
                id="cart-heading"
                className="sr-only"
              >
                {description}
              </h2>

              {!hasItems ? (
                <div className="py-16">
                  <p className="text-lg text-gray-400">
                    {empty}
                  </p>

                  <p className="my-2 text-gray-500">
                    {emptyDescription}
                  </p>

                  <Link
                    href={`/${lang}/shop`}
                    prefetch={false}
                    className="relative mt-10 inline-flex items-center justify-center rounded-md border border-white/10 bg-white/10 px-8 py-2 text-sm font-medium text-white hover:bg-white/20"
                  >
                    {CTAAdd}
                  </Link>
                </div>
              ) : (
                <>
                  {showPagination && (
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm text-gray-400">
                        {text.page}{" "}
                        {safePage}{" "}
                        {text.pageOf}{" "}
                        {totalPages}
                      </p>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={
                            safePage === 1
                          }
                          onClick={() =>
                            setPage(
                              (current) =>
                                Math.max(
                                  1,
                                  current -
                                    1
                                )
                            )
                          }
                          className="rounded-md border border-white/20 px-3 py-1.5 text-sm text-gray-200 disabled:opacity-40"
                        >
                          {
                            text.previousPage
                          }
                        </button>

                        <button
                          type="button"
                          disabled={
                            safePage ===
                            totalPages
                          }
                          onClick={() =>
                            setPage(
                              (current) =>
                                Math.min(
                                  totalPages,
                                  current +
                                    1
                                )
                            )
                          }
                          className="rounded-md border border-white/20 px-3 py-1.5 text-sm text-gray-200 disabled:opacity-40"
                        >
                          {text.nextPage}
                        </button>
                      </div>
                    </div>
                  )}

                  <ul className="divide-y divide-gray-200 border-b border-t border-gray-200">
                    {visibleItems.map(
                      (product) => {
                        const handle =
                          getProductHandle(
                            product
                          );

                        const href =
                          handle
                            ? `/${lang}/product/${handle}`
                            : null;

                        return (
                          <li
                            key={
                              product.id
                            }
                            className="flex py-6 sm:py-10"
                          >
                            <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-stone-600 sm:size-48">
                              {product.imageUrl &&
                                (href ? (
                                  <Link
                                    href={
                                      href
                                    }
                                    prefetch={
                                      false
                                    }
                                    aria-label={
                                      product.title
                                    }
                                    className="block size-full"
                                  >
                                    <Image
                                      width={
                                        640
                                      }
                                      height={
                                        640
                                      }
                                      alt={
                                        product.imageAlt
                                      }
                                      src={
                                        product.imageUrl
                                      }
                                      className="size-full object-contain p-3"
                                    />
                                  </Link>
                                ) : (
                                  <Image
                                    width={
                                      640
                                    }
                                    height={
                                      640
                                    }
                                    alt={
                                      product.imageAlt
                                    }
                                    src={
                                      product.imageUrl
                                    }
                                    className="size-full object-contain p-3"
                                  />
                                ))}
                            </div>

                            <div className="ml-4 flex flex-1 justify-between sm:ml-6">
                              <div>
                                <h3 className="pr-4 text-lg font-medium text-yellow-400">
                                  {href ? (
                                    <Link
                                      href={
                                        href
                                      }
                                      prefetch={
                                        false
                                      }
                                      className="hover:opacity-80"
                                    >
                                      {
                                        product.title
                                      }
                                    </Link>
                                  ) : (
                                    product.title
                                  )}
                                </h3>

                                {href && (
                                  <Link
                                    href={
                                      href
                                    }
                                    prefetch={
                                      false
                                    }
                                    className="mt-1 inline-block text-sm text-gray-300 underline underline-offset-4"
                                  >
                                    {
                                      text.viewProduct
                                    }
                                  </Link>
                                )}
                              </div>

                              <div className="flex flex-col items-end gap-5">
                                <div className="flex items-center gap-4">
                                  <p className="whitespace-nowrap text-base font-medium text-gray-300">
                                    {(
                                      product.unitPrice *
                                      product.quantity
                                    ).toFixed(
                                      2
                                    )}
                                    {
                                      "\u00A0€"
                                    }
                                  </p>

                                  <button
                                    type="button"
                                    disabled={
                                      isCartLocked
                                    }
                                    onClick={() =>
                                      void removeLine(
                                        product.id
                                      )
                                    }
                                    className="p-2 text-gray-400 hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <span className="sr-only">
                                      {
                                        text.removeProduct
                                      }
                                    </span>

                                    <XMarkIconMini className="size-5" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={
                                      isCartLocked
                                    }
                                    aria-label={
                                      text.decreaseQuantity
                                    }
                                    onClick={() =>
                                      void updateLineQuantity(
                                        product.id,
                                        Math.max(
                                          1,
                                          product.quantity -
                                            1
                                        )
                                      )
                                    }
                                    className="flex size-8 items-center justify-center rounded-md border border-gray-400 text-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    −
                                  </button>

                                  <span className="w-8 text-center text-gray-200">
                                    {
                                      product.quantity
                                    }
                                  </span>

                                  <button
                                    type="button"
                                    disabled={
                                      isCartLocked
                                    }
                                    aria-label={
                                      text.increaseQuantity
                                    }
                                    onClick={() =>
                                      void updateLineQuantity(
                                        product.id,
                                        product.quantity +
                                          1
                                      )
                                    }
                                    className="flex size-8 items-center justify-center rounded-md border border-gray-400 text-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      }
                    )}
                  </ul>
                </>
              )}
            </section>

            {hasItems && (
              <div className="mt-16 lg:col-span-5 lg:mt-0">
                <section
                  aria-labelledby="summary-heading"
                  className="rounded-lg border border-white/10 bg-white/5 p-4 sm:p-6 lg:p-8"
                >
                  <h2
                    id="summary-heading"
                    className="text-lg font-semibold text-white"
                  >
                    {orderSummary}
                  </h2>

                  <div className="mt-5">
                    <label
                      htmlFor="delivery-country"
                      className="block text-sm font-semibold text-gray-200"
                    >
                      {text.countryLabel}
                    </label>

                    <select
                      id="delivery-country"
                      value={
                        selectedCountry
                      }
                      disabled={
                        isCartLocked
                      }
                      onChange={(event) =>
                        setSelectedCountry(
                          event.target
                            .value
                        )
                      }
                      className="mt-2 block w-full rounded-md border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">
                        {
                          text.countryPlaceholder
                        }
                      </option>

                      {countryOptions.map(
                        (country) => (
                          <option
                            key={
                              country.code
                            }
                            value={
                              country.code
                            }
                          >
                            {
                              country.name
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="mt-5 rounded-lg border border-yellow-400/20 bg-yellow-400/10 p-4">
                    <p className="text-sm font-semibold text-yellow-400">
                      {hasPendingQuote
                        ? text.successTitle
                        : !hasSelectedCountry
                          ? text.selectCountryTitle
                          : standardEstoniaDelivery
                            ? text.standardTitle
                            : text.quoteTitle}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-gray-300">
                      {hasPendingQuote
                        ? text.successMessage
                        : !hasSelectedCountry
                          ? text.selectCountryMessage
                          : standardEstoniaDelivery
                            ? text.standardMessage
                            : text.quoteMessage}
                    </p>
                  </div>

                  <dl className="mt-6 space-y-4 pb-6">
                    <div className="flex items-center justify-between">
                      <dt className="text-base text-gray-300">
                        {subtotal}
                      </dt>

                      <dd className="whitespace-nowrap text-sm font-medium text-gray-300">
                        {totalPrice.toFixed(
                          2
                        )}
                        {"\u00A0€"}
                      </dd>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <dt className="flex items-center text-base text-gray-400">
                        {
                          shippingEstimate
                        }

                        <span className="ml-2">
                          <span className="sr-only">
                            {
                              shippingEstimateInfo
                            }
                          </span>

                          <QuestionMarkCircleIcon className="size-5" />
                        </span>
                      </dt>

                      <dd className="max-w-44 text-right text-sm font-medium text-gray-400">
                        {hasPendingQuote ||
                        requiresDeliveryQuote ? (
                          text.pending
                        ) : !hasSelectedCountry ? (
                          "—"
                        ) : (
                          <span className="whitespace-nowrap">
                            {shippingCost.toFixed(
                              2
                            )}
                            {"\u00A0€"}
                          </span>
                        )}
                      </dd>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <dt className="text-base font-medium text-yellow-400">
                        {total}
                      </dt>

                      <dd className="text-right text-base font-medium text-yellow-400">
                        {hasPendingQuote ||
                        requiresDeliveryQuote ? (
                          text.pending
                        ) : !hasSelectedCountry ? (
                          "—"
                        ) : (
                          <span className="whitespace-nowrap">
                            {orderTotal.toFixed(
                              2
                            )}
                            {"\u00A0€"}
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>

                  {!hasSelectedCountry &&
                    !hasPendingQuote && (
                      <button
                        type="button"
                        disabled
                        className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-900 opacity-60"
                      >
                        {
                          text.selectCountryButton
                        }
                      </button>
                    )}

                  {standardEstoniaDelivery &&
                    !hasPendingQuote &&
                    cart.checkoutUrl && (
                      <button
                        type="button"
                        onClick={
                          handleCheckoutClick
                        }
                        disabled={
                          isLoading
                        }
                        className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-900 hover:border-yellow-600 hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {checkout}
                      </button>
                    )}

                  {hasPendingQuote && (
                    <div
                      role="status"
                      className="rounded-lg border border-green-400/30 bg-green-400/10 p-4"
                    >
                      <p className="font-semibold text-green-300">
                        {
                          text.successTitle
                        }
                      </p>

                      <p className="mt-1 text-sm leading-6 text-gray-200">
                        {
                          text.successMessage
                        }
                      </p>

                      <p className="mt-2 text-sm font-semibold text-white">
                        {
                          text.requestNumber
                        }
                        :{" "}
                        {activeRequestNumber ??
                          "—"}
                      </p>
                    </div>
                  )}

                  {requiresDeliveryQuote &&
                    !hasPendingQuote && (
                      <form
                        onSubmit={
                          handleQuoteSubmit
                        }
                        className="grid grid-cols-1 gap-3 rounded-lg border border-white/10 bg-black/20 p-4 sm:grid-cols-2"
                      >
                        {formFields.map(
                          (field) => (
                            <input
                              key={
                                field.key
                              }
                              required={
                                field.required
                              }
                              type={
                                field.type
                              }
                              autoComplete={
                                field.autoComplete
                              }
                              value={
                                quoteForm[
                                  field.key
                                ]
                              }
                              onChange={(
                                event
                              ) =>
                                updateQuoteField(
                                  field.key,
                                  event
                                    .target
                                    .value
                                )
                              }
                              placeholder={
                                field.label
                              }
                              aria-label={
                                field.label
                              }
                              className={`rounded-md border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-yellow-400 focus:outline-none ${
                                field.fullWidth
                                  ? "sm:col-span-2"
                                  : ""
                              }`}
                            />
                          )
                        )}

                        <input
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                          value={
                            quoteForm.website
                          }
                          onChange={(
                            event
                          ) =>
                            updateQuoteField(
                              "website",
                              event.target
                                .value
                            )
                          }
                          className="hidden"
                          aria-hidden="true"
                        />

                        {quoteError && (
                          <p
                            role="alert"
                            className="text-sm text-red-300 sm:col-span-2"
                          >
                            {quoteError}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={
                            isQuoteSubmitting ||
                            isLoading ||
                            isCartLocked
                          }
                          className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-900 hover:border-yellow-600 hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
                        >
                          {isQuoteSubmitting
                            ? text.submittingQuote
                            : text.submitQuote}
                        </button>
                      </form>
                    )}

                  <button
                    type="button"
                    onClick={() =>
                      void clearCart()
                    }
                    disabled={
                      isLoading ||
                      isCartLocked
                    }
                    className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-white/20 bg-transparent px-5 py-2 text-sm font-semibold text-gray-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {text.clearCart}
                  </button>
                </section>

                <Link
                  href={`/${lang}/shop`}
                  prefetch={false}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-white/20 bg-transparent px-5 py-2 text-sm font-semibold text-gray-200 hover:bg-white/5"
                >
                  {
                    text.continueShopping
                  }
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}