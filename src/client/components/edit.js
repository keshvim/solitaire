"use strict";

import React, { Fragment, useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import styled from "styled-components";
import {
  ErrorMessage,
  FormBase,
  FormInput,
  FormLabel,
  FormButton,
  ModalNotify
} from "./shared.js";

export const Edit = (props) => {
    // const { username } = useParams();
    let navigate = useNavigate();
    let [state, setState] = useState({
        username: props.currentUser.username,
        first_name: props.currentUser.first_name,
        last_name: props.currentUser.last_name,
        city: props.currentUser.city,
    });
    // let [error, setError] = useState("");
    // let [notify, setNotify] = useState("");

    useEffect(() => {
        // async function getCurrentProfile() {
        //     const res = await fetch(`v1/user/${props.currentUser.username}`, {
        //         method: "GET",
        //         headers: {
        //             "content-type": "application/json",
        //         },
        //     });
        //     const resJson = await res.json();
        //     setState({
        //         ...state,
        //         first_name: resJson.body.first_name,
        //         last_name: resJson.body.last_name,
        //         city: resJson.body.city,
        //     });
        // }
        // document.getElementById("first_name").value = state.first_name;
        // document.getElementById("last_name").value = state.last_name;
        // document.getElementById("city").value = state.city;
        document.getElementById("first_name").focus();
    }, []);

    const fetchUser = (username) => {
        fetch(`/v1/user/${username}`)
          .then((res) => res.json())
          .then((data) => {
            setState(data);
          })
          .catch((err) => console.log(err));
      };

    const onChange = (ev) => {
        // setError("");
        // Update from form and clear errors
        setState({
            ...state,
            [ev.target.name]: ev.target.value,
        });
    };

    const onSubmit = async (ev) => {
        ev.preventDefault();
        // Only proceed if there are no errors
        // if (error !== "") return;
        const data = {
            first_name: state.first_name,
            last_name: state.last_name,
            city: state.city
        }
        const res = await fetch(`/v1/user/${props.currentUser.username}`, {
            method: "PUT",
            body: JSON.stringify(data),
            credentials: "include",
            headers: {
                "content-type": "application/json",
            },
        });
        // const resJson = await res.json();
        if (res.ok) {
            // Notify users
            // setNotify(`${state.username} registered.  You will now need to log in.`);
            props.logIn(props.currentUser.username);
            navigate(`/profile/${props.currentUser.username}`);
        } else {
            // const err = await res.json();
            // setError(err.error);
            console.log("Edit failed")
        }
    };

    const onCancel = async (ev) => {
        ev.preventDefault();
        navigate(`/profile/${props.currentUser.username}`);
    }
    
    // const onAcceptRegister = () => {
    //   navigate(`/profile/${props.currentUser}`);
    // };

    return (
        <div style={{ gridArea: "main" }}>
        {/* <ErrorMessage msg={error} /> */}
        <FormBase>
            <FormLabel htmlFor="first_name">First Name:</FormLabel>
            <FormInput
            id="first_name"
            name="first_name"
            placeholder="First Name"
            onChange={onChange}
            value={state.first_name}
            />

            <FormLabel htmlFor="last_name">Last Name:</FormLabel>
            <FormInput
            id="last_name"
            name="last_name"
            placeholder="Last Name"
            onChange={onChange}
            value={state.last_name}
            />

            <FormLabel htmlFor="city">City:</FormLabel>
            <FormInput
            id="city"
            name="city"
            placeholder="City"
            onChange={onChange}
            value={state.city}
            />
            <div />
            <FormButton id="cancelBtn" onClick={onCancel}>
            Cancel
            </FormButton>
            <FormButton id="submitBtn" onClick={onSubmit}>
            Update
            </FormButton>
        </FormBase>
        </div>
    )
}

Edit.propTypes = {
    logIn: PropTypes.func.isRequired,
};