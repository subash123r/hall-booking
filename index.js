import express from "express";

// Setting PORT
const PORT = 3000;

// Initializiing Express Server

const app = express();
app.use(express.json());

let rooms = [];
let roomBooking = [];
let bookedRooms = [];
let customerWithBookedData = [];
let allBookedRooms = [];
function isEmpty(obj) {
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return false;
    }
  }

  return true;
}

app.get("/", (req, res) => {
  res.send(`    
    <h1 style="text-align: center">Hall Booking API</h1>
    <p>Try API enpoints:</p>
    <p>Base url: http://localhost:3000/</p>

    <ol style="display: flex; flex-direction: column; gap: 0.5rem">
      <li>/room/all (GET) - Show all created rooms</li>
      <li>
        <div style="display: flex; gap: 0.5rem">
          <span style="min-width: fit-content;">/room/create (POST) - </span>
          <span>
            Create room with eg. 
            { 
              "room_name": "CS VIP Hall",
              "number_of_available_seats": 150, 
              "amenities": ["WiFi", "Well-Maintained Restrooms", "Parking","Audio-Visual
              Equipment","Catering Services"], 
              "price_per_hour": 190 
            }
          </span>
        </div>
      </li>
      <li>/room/edit/:id (PUT) -  Edit room</li>
      <li>/room/delete/:id (DELETE) -  Delete room</li>
      <li>        
        <div style="display: flex; gap: 0.5rem">
          <span style="min-width: fit-content;">/room/booking (POST) - </span>
          <span>
            Book a room with eg. 
            {
              "customer_name": "name",
              "start_time": "1 AM",
              "end_time": "7 PM",
              "roomId": 1
            }
          </span>
        </div>
      </li>
      <li>/room/allBookedRooms (GET) - List all Rooms with Booked Data</li>
      <li>/room/bookedRooms (GET) - List all customers with Booked Data</li>
      <li>/room/bookedCount (GET) - List how many times a customer has booked the room</li>
    </ol>
    `);
});

// Room
app.get("/room/all", (req, res) => {
  if (!rooms.length) {
    return res.json({ message: "No rooms found. Create a room!" });
  }
  return res.send(rooms);
});

// Create Room
app.post("/room/create", (req, res) => {
  const reqBody = req.body;
  if (
    !reqBody.room_name ||
    !reqBody.number_of_available_seats ||
    !reqBody.amenities ||
    !reqBody.price_per_hour
  ) {
    return res.json({
      message:
        "room_name, number_of_available_seats, amenities and price_per_hour are required",
    });
  }
  const newRoom = { _id: rooms.length + 1, ...req.body };
  rooms = [...rooms, newRoom];
  res.send(newRoom);
});

// Edit Room
app.put("/room/edit/:id", (req, res) => {
  const _id = req.params.id;
  const reqBody = req.body;
  if (
    !reqBody.room_name ||
    !reqBody.number_of_available_seats ||
    !reqBody.amenities ||
    !reqBody.price_per_hour
  ) {
    return res.json({
      message:
        "room_name, number_of_available_seats, amenities and price_per_hour are required",
    });
  }
  const findRoom = rooms.find((room) => room._id == _id);
  if (isEmpty(findRoom)) {
    return res.json({ message: "No room found in this ID" });
  }
  const roomIndex = rooms.indexOf(findRoom);
  const editRoom = { _id: _id, ...req.body };
  rooms[roomIndex] = editRoom;
  res.send(editRoom);
});

// Delete Room
app.delete("/room/delete/:id", (req, res) => {
  const _id = req.params.id;
  const findRoom = rooms.find((room) => room._id == _id);
  if (isEmpty(findRoom)) {
    return res.json({ message: "No room found in this ID" });
  }
  let newRooms = rooms.filter((data) => data._id != _id);
  rooms = [...newRooms];
  res.send(findRoom);
});

// Booking a Room
function checkAlreadyBooked(
  req,
  res,
  start_time,
  end_time,
  roomId,
  currentDate
) {
  let flag;
  let filterRoomInRoomBooking = roomBooking.filter(
    (customerRoom) => customerRoom.roomId == roomId
  );
  if (filterRoomInRoomBooking.length != 0) {
    filterRoomInRoomBooking.forEach((room) => {
      if (
        (room.start_time == start_time || room.end_time == end_time) &&
        room.date == currentDate
      ) {
        res.json({
          message: "Room is already booked, select other date or time!",
        });
        flag = false;
        return false;
      } else flag = true;
    });
  } else {
    return true;
  }
  return flag;
}

// Booking a Room
app.post("/room/booking", (req, res) => {
  if (!rooms.length) {
    return res.json({ message: "No rooms found. Create a room!" });
  }
  const reqBody = req.body;
  const currentDate = new Date().toJSON().slice(0, 10);
  let flag;
  if (
    !reqBody.customer_name ||
    !reqBody.start_time ||
    !reqBody.end_time ||
    !reqBody.roomId
  ) {
    return res.json({
      message: "customer_name, start_time, end_time and roomId are required",
    });
  }

  let findRoomInRooms = rooms.find((room) => room._id == reqBody.roomId);
  if (isEmpty(findRoomInRooms)) {
    return res.json({
      message: "The selected room ID does not have any availability.",
    });
  }

  flag = checkAlreadyBooked(
    req,
    res,
    reqBody.start_time,
    reqBody.end_time,
    reqBody.roomId,
    currentDate
  );

  if (flag) {
    const newBookedRoom = {
      _id: roomBooking.length + 1,
      ...req.body,
      date: currentDate,
      booked_status: true,
    };
    roomBooking = [...roomBooking, newBookedRoom];
    flag = false;
    return res.json({
      message: "Hall booked successfully",
      newBookedRoom: newBookedRoom,
    });
  }
});

// List all Rooms with Booked Data
app.get("/room/allBookedRooms", (req, res) => {
  if (rooms.length == 0) {
    return res.send({ message: "No Rooms found. Create a Room!" });
  }
  if (roomBooking.length == 0) {
    return res.json({ message: "No customers have booked the room." });
  }
  if (allBookedRooms.length > 0) {
    allBookedRooms = [];
  }
  let filteredcustomerByBookedRoom = {};
  rooms.forEach((room) => {
    let filterRoom = roomBooking.filter(
      (customerRoom) => room._id == customerRoom.roomId
    );

    let customers_as_per_room = [];

    filterRoom.forEach((customer) => {
      customers_as_per_room.push({
        room_name: room.room_name,
        booked_status: "booked",
        customer_name: customer.customer_name,
        date: customer.date,
        start_time: customer.start_time,
        end_time: customer.end_time,
      });
    });
    filteredcustomerByBookedRoom[room.room_name] = customers_as_per_room;
    if (filterRoom.length == 0) {
      filteredcustomerByBookedRoom[room.room_name] = {
        room_name: room.room_name,
        booked_status: "not booked",
        customer_name: "N/A",
        date: "N/A",
        start_time: "N/A",
        end_time: "N/A",
      };
    }
  });
  if (!isEmpty(filteredcustomerByBookedRoom)) {
    allBookedRooms.push(filteredcustomerByBookedRoom);
  }
  return res.json({
    message: "Successfully listed, all Rooms with Booked Data",
    data: allBookedRooms,
  });
});

// List all customers with Booked Data
app.get("/room/bookedRooms", (req, res) => {
  if (!rooms.length) {
    return res.json({ message: "No rooms found. Create a room!" });
  }
  if (roomBooking.length == 0) {
    return res.json({ message: "No customers have booked the room." });
  }
  bookedRooms = [];
  let filteredCustomerByCustomerName = {};

  rooms.forEach((room) => {
    let filterCustomerByRoomId = roomBooking.filter(
      (customerRoom) => room._id == customerRoom.roomId
    );

    let filterDuplicateCustomerName = {};
    let removedDuplicateCustomerName = [];

    filterCustomerByRoomId.forEach((filRoom) => {
      if (!filterDuplicateCustomerName.hasOwnProperty(filRoom.customer_name)) {
        filterDuplicateCustomerName[filRoom.customer_name] = true;
        removedDuplicateCustomerName.push(filRoom.customer_name);
      }
    });

    removedDuplicateCustomerName.forEach((customerName) => {
      let filterCustomerByCustomerName = roomBooking.filter(
        (customerRoom) => customerRoom.customer_name == customerName
      );

      let addRoomName = [];
      filterCustomerByCustomerName.forEach((customer) =>
        addRoomName.push({
          customer_name: customer.customer_name,
          room_name: room.room_name,
          date: customer.date,
          start_time: customer.start_time,
          end_time: customer.end_time,
        })
      );
      filteredCustomerByCustomerName[customerName] = addRoomName;
    });
  });
  if (!isEmpty(filteredCustomerByCustomerName)) {
    bookedRooms.push(filteredCustomerByCustomerName);
  }
  return res.json({
    message: "Successfully listed, all customer with booked data",
    data: bookedRooms,
  });
});

// List how many times a customer has booked the room
app.get("/room/bookedCount", (req, res) => {
  if (rooms.length == 0) {
    return res.send({ message: "No Rooms found. Create a Room!" });
  }
  if (roomBooking.length == 0) {
    return res.json({ message: "No customers have booked the room." });
  }
  if (customerWithBookedData.length > 0) {
    customerWithBookedData = [];
  }
  let filteredcustomerByBookedRoom = {};
  rooms.forEach((room) => {
    let filterCustomerByRoomId = roomBooking.filter(
      (customerRoom) => room._id == customerRoom.roomId
    );

    let filterDuplicateCustomerName = {};
    let removedDuplicateCustomerName = [];

    filterCustomerByRoomId.forEach((filRoom) => {
      if (!filterDuplicateCustomerName.hasOwnProperty(filRoom.customer_name)) {
        filterDuplicateCustomerName[filRoom.customer_name] = true;
        removedDuplicateCustomerName.push(filRoom.customer_name);
      }
    });
    removedDuplicateCustomerName.forEach((customerName) => {
      let filterCustomerByCustomerName = roomBooking.filter(
        (customerRoom) => customerRoom.customer_name == customerName
      );

      let addRoomName = [];
      filterCustomerByCustomerName.forEach((customer) =>
        addRoomName.push({
          customer_name: customer.customer_name,
          room_name: room.room_name,
          date: customer.date,
          start_time: customer.start_time,
          end_time: customer.end_time,
          bookingId: customer._id,
          booking_date: customer.date,
          booked_status: "booked",
        })
      );
      filteredcustomerByBookedRoom[customerName] = [
        { booking_count: addRoomName.length },
        ...addRoomName,
      ];
    });
  });
  if (!isEmpty(filteredcustomerByBookedRoom)) {
    customerWithBookedData.push(filteredcustomerByBookedRoom);
  }
  return res.json({
    message:
      "Successfully listed, how many times a customer has booked the room",
    data: customerWithBookedData,
  });
});

// Activating and listening server
app.listen(PORT, () => {
  console.log(`Server started in PORT : ${PORT}
    listening in http://localhost:${PORT}`);
});