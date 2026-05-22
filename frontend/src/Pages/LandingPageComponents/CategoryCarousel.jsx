import React, { useEffect, useState } from "react";
import { Box, Flex, Heading } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./LandingPageComponent.css";
import Card from "./Card";
import LoadingComponent from "../LoadingComponents/LoadingComponent";
import { API_BASE_URL } from "../../config/api";

const CategoryCarousel = ({ category }) => {
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const arr = [1, 2, 3, 4];
  const token = useSelector((s) => s.UserReducer?.token);
  var settings = {
    swipe: true,
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 800,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 500,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  useEffect(() => {
    // Build URL with category filter if provided
    let url = `${API_BASE_URL}/courses/all`;
    if (category) {
      url += `?category=${encodeURIComponent(category)}`;
    }
    setLoading(true);

    fetch(url)
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Error: " + response.status);
        }
      })
      .then((data) => {
        setCourse(data.course);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setLoading(false);
      });

    // Fetch enrolled course IDs if logged in
    if (token) {
      fetch(`${API_BASE_URL}/users/enrolled-courses`, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setEnrolledIds(
            (data.enrolledCourseIds || []).map((id) => id.toString())
          );
        })
        .catch(() => {});
    }
  }, [category, token]);

  return (
    <Flex direction={"column"} width="80%" p={"20px"} m={"auto"}>
      <Slider {...settings}>
        {!loading
          ? course?.map((el) => (
              <Card
                {...el}
                key={el._id}
                resumeLearning={enrolledIds.includes(el._id)}
              />
            ))
          : arr.map((el, i) => <LoadingComponent key={i} />)}
      </Slider>
    </Flex>
  );
};

export default CategoryCarousel;