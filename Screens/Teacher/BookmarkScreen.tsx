import React,
{ useEffect, useState } from "react";

function BookmarkScreen() {

    const [bookmarks,
        setBookmarks] = useState<any[]>([]);


    useEffect(() => {

        fetchBookmarks();

    }, []);


    const fetchBookmarks = async () => {

        const res = await fetch(
            "http://localhost:3000/api/bookmarks/all"
        );

        const data = await res.json();

        setBookmarks(data);

    };


    return (

        <div>

            <h2>My Bookmarks</h2>

            <ul>

                {bookmarks.map((b) => (

                    <li key={b.id}>

                        <b>{b.file_name}</b>

                        <br />

                        Pages:
                        {b.start_page}
                        -
                        {b.end_page}

                    </li>

                ))}

            </ul>

        </div>

    );

}

export default BookmarkScreen;